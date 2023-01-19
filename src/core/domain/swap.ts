import type { Deadline } from '../types'
import { computeTransactionFee, deadlineFiveMinutesFromNow } from '../utils'
import { Percent, Trade, Wei } from '../entities'
import CommonContracts from './CommonContracts'
import { Agent } from './agent'
import { IsomorphicOverrides, TransactionObject } from '../isomorphic-contract'
import invariant from 'tiny-invariant'
import { Simplify } from 'type-fest'
import { MAX_UINT256, isNativeToken } from '../const'
import { match } from 'ts-pattern'
import { SlippagePercent, adjustDown, adjustUp, parseSlippage } from '../slippage'

interface HasTrade {
  trade: Trade
}

export interface SwapPropsBase extends HasTrade {
  /**
   * By default it is 5 minutes from now.
   */
  deadline?: Deadline
  /**
   * If true, the maximum amount for IN token will be approved before swap.
   *
   * If not, the only maximum needed amount will be approved.
   *
   * @default false
   */
  expertMode?: boolean
}

export interface AmountsExactIn {
  amountIn: Wei
  amountOutMin: Wei
}

export interface AmountsExactOut {
  amountInMax: Wei
  amountOut: Wei
}

export interface SwapWithExactInput extends AmountsExactIn {
  mode: `exact-in`
}

export interface SwapWithExactOutput extends AmountsExactOut {
  mode: `exact-out`
}

export type SwapProps = SwapPropsBase & SwapPropsAmounts

type SwapPropsAmounts = SwapWithExactInput | SwapWithExactOutput

export interface SwapResult {
  fee: Wei
  send: () => Promise<unknown>
}

export interface GetAmountsExactInputProps extends HasTrade {
  mode: 'exact-in'
  amountIn: Wei
}

export interface GetAmountsExactOutputProps extends HasTrade {
  mode: 'exact-out'
  amountOut: Wei
}

export type GetAmountsForExactInputResult = Simplify<AmountsExactIn & AmountsInOut>

export type GetAmountsForExactOutputResult = Simplify<AmountsExactOut & AmountsInOut>

export interface AmountsInOut {
  amountIn: Wei
  amountOut: Wei
}

export interface GetAmountsReturn extends AmountsInOut {
  amounts: Wei[]
}

/**
 * Utility function to be used outside of the domain module
 */
export function applySlippageForExactInput(amountOut: Wei, slippage: SlippagePercent): { amountOutMin: Wei } {
  return { amountOutMin: adjustDown(amountOut, slippage) }
}

/**
 * Utility function to be used outside of the domain module
 */
export function applySlippageForExactOutput(amountIn: Wei, slippage: SlippagePercent): { amountInMax: Wei } {
  return { amountInMax: adjustUp(amountIn, slippage) }
}

/**
 * Consists of amounts on each swap stage during the path.
 * We need only the first (input) and the last (output).
 */
function amountsArrayToWeiInOut(array: Wei[]): { amountIn: Wei; amountOut: Wei } {
  const first = array.at(0)
  const last = array.at(-1)
  invariant(first && last)
  return { amountIn: first, amountOut: last }
}

export class SwapPure {
  #contracts: CommonContracts

  public constructor(props: { contracts: CommonContracts }) {
    this.#contracts = props.contracts
  }

  protected get contracts() {
    return this.#contracts
  }

  public async getAmounts(props: GetAmountsExactInputProps | GetAmountsExactOutputProps): Promise<GetAmountsReturn> {
    const router = await this.routerContract()
    const path = props.trade.routePath()

    const amountsArrayRaw =
      props.mode === 'exact-in'
        ? await router.getAmountsOut([props.amountIn.asStr, path]).call()
        : await router.getAmountsIn([props.amountOut.asStr, path]).call()

    const amounts = amountsArrayRaw.map((x) => new Wei(x))

    return { amounts, ...amountsArrayToWeiInOut(amounts) }
  }

  private async routerContract() {
    return this.#contracts.get('router') || this.#contracts.init('router')
  }
}

export class Swap extends SwapPure {
  #agent: Agent

  public constructor(props: { agent: Agent; contracts: CommonContracts }) {
    super(props)
    this.#agent = props.agent
  }

  public async prepareSwap(props: SwapProps): Promise<SwapResult> {
    await this.approveAmountForSwap(props)

    const router = this.contracts.get('router') || (await this.contracts.init('router'))

    const { deadline = deadlineFiveMinutesFromNow() } = props
    const { address } = this.#agent
    const path = props.trade.routePath()

    const gasPrice = await this.#agent.getGasPrice()
    const baseOverrides: IsomorphicOverrides = {
      gasPrice,
      from: address,
    }

    const isInputTokenNative = isNativeToken(props.trade.route.input.address)
    const isOutputTokenNative = isNativeToken(props.trade.route.output.address)

    const tx: TransactionObject<unknown> = match([isInputTokenNative, isOutputTokenNative] as [boolean, boolean])
      .with([false, false], () =>
        match(props)
          .with({ mode: 'exact-in' }, ({ amountIn, amountOutMin }) =>
            router.swapExactTokensForTokens([amountIn.asStr, amountOutMin.asStr, path, address, deadline]),
          )
          .with({ mode: 'exact-out' }, ({ amountInMax, amountOut }) =>
            router.swapTokensForExactTokens([amountOut.asStr, amountInMax.asStr, path, address, deadline]),
          )
          .exhaustive(),
      )
      .with([false, true], () =>
        match(props)
          .with({ mode: 'exact-in' }, ({ amountIn, amountOutMin }) =>
            router.swapExactTokensForKLAY([amountIn.asStr, amountOutMin.asStr, path, address, deadline]),
          )
          .with({ mode: 'exact-out' }, ({ amountInMax, amountOut }) =>
            router.swapTokensForExactKLAY([amountOut.asStr, amountInMax.asStr, path, address, deadline]),
          )
          .exhaustive(),
      )
      .with([true, false], () =>
        match(props)
          .with({ mode: 'exact-in' }, ({ amountIn, amountOutMin }) =>
            router.swapExactKLAYForTokens([amountOutMin.asStr, path, address, deadline], {
              ...baseOverrides,
              value: amountIn,
            }),
          )
          .with({ mode: 'exact-out' }, ({ amountInMax, amountOut }) =>
            router.swapKLAYForExactTokens([amountOut.asStr, path, address, deadline], {
              ...baseOverrides,
              value: amountInMax,
            }),
          )
          .exhaustive(),
      )
      .with([true, true], () => {
        throw new Error('unreachable')
      })
      .exhaustive()

    const { gas, send } = await tx.estimateAndPrepareSend()
    const fee = computeTransactionFee(gasPrice, gas)

    return { fee, send }
  }

  private async approveAmountForSwap(props: SwapProps): Promise<void> {
    const inputToken = props.trade.route.input.address

    const amountForApprove = props.expertMode
      ? new Wei(MAX_UINT256)
      : props.mode === 'exact-in'
      ? props.amountIn
      : props.amountInMax

    await this.#agent.approveAmount(inputToken, amountForApprove)
  }
}

if (import.meta.vitest) {
  const { test, expect, describe } = import.meta.vitest

  describe('applySlippage', () => {
    test('0 slippage with exact input', () => {
      expect(applySlippageForExactInput(new Wei(10000000), parseSlippage(new Percent(0)))).toMatchInlineSnapshot(`
        {
          "amountOutMin": "10000000",
        }
      `)
    })

    test('0.5% slippage with exact input', () => {
      expect(applySlippageForExactInput(new Wei(10000000), parseSlippage(new Percent(5, 1000)))).toMatchInlineSnapshot(`
        {
          "amountOutMin": "9950000",
        }
      `)
    })

    test('2.5% slippage with exact output', () => {
      expect(applySlippageForExactOutput(new Wei(10000000), parseSlippage(new Percent(25, 1000))))
        .toMatchInlineSnapshot(`
        {
          "amountInMax": "10250000",
        }
      `)
    })

    test('2% slippage with exact output, small wei amount', () => {
      expect(applySlippageForExactOutput(new Wei(1), parseSlippage(new Percent(2, 100)))).toMatchInlineSnapshot(`
        {
          "amountInMax": "1",
        }
      `)
    })
  })

  describe('Parse amounts array', () => {
    const serde = (x: any) => JSON.parse(JSON.stringify(x))

    test.each([
      [['1', '2', '3'], { amountIn: new Wei(1), amountOut: new Wei(3) }],
      [['1', '2'], { amountIn: new Wei(1), amountOut: new Wei(2) }],
      [['1', '2', '3', '4', '5'], { amountIn: new Wei(1), amountOut: new Wei(5) }],
    ])('Amounts from %o extracted to %O', (array, result) => {
      expect(serde(amountsArrayToWeiInOut(array.map((x) => new Wei(x))))).toEqual(serde(result))
    })
  })
}
