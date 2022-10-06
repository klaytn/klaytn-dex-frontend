import type { Deadline } from '../types'
import { computeTransactionFee, deadlineFiveMinutesFromNow } from '../utils'
import { Fraction, Trade, Wei, Percent } from '../entities'
import CommonContracts from './CommonContracts'
import { Agent } from './agent'
import { TransactionObject, IsomorphicOverrides } from '../isomorphic-contract'
import invariant from 'tiny-invariant'
import { Opaque, Simplify } from 'type-fest'
import BigNumber from 'bignumber.js'
import { BigNumber as EthersBigNumber } from 'ethers'
import { MAX_UINT256 } from '../const'

const ZERO = new Fraction(0)
const ONE = new Fraction(1)

type SlippagePercent = Opaque<Percent, 'non-negative'>

export function parseSlippage(raw: Percent): SlippagePercent {
  invariant(!raw.isLessThan(ZERO), () => `Slippage should be a non-negative number, got: ${raw.toFixed()}`)
  return raw as SlippagePercent
}

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

export interface SwapExactAForB<A extends string, B extends string> extends AmountsExactIn {
  mode: `exact-${A}-for-${B}`
}

export interface SwapAForExactB<A extends string, B extends string> extends AmountsExactOut {
  mode: `${A}-for-exact-${B}`
}

export type SwapExactForAndForExact<A extends string, B extends string> = SwapAForExactB<A, B> | SwapExactAForB<A, B>

export type SwapProps = SwapPropsBase & SwapPropsAmounts

type SwapPropsAmounts =
  | SwapExactForAndForExact<'tokens', 'tokens'>
  | SwapExactForAndForExact<'tokens', 'eth'>
  | SwapExactForAndForExact<'eth', 'tokens'>

function isSwapExactInput<A extends string, B extends string>(
  props: SwapExactForAndForExact<A, B>,
): props is SwapExactAForB<A, B> {
  return props.mode.startsWith('exact-')
}

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

export function applySlippageForExactInput(amountOut: Wei, slippage: SlippagePercent): { amountOutMin: Wei } {
  const adjusted = ONE.plus(slippage).invert().multipliedBy(new Fraction(amountOut.asBigInt)).quotient.decimalPlaces(0)

  return { amountOutMin: new Wei(adjusted) }
}

export function applySlippageForExactOutput(amountIn: Wei, slippage: SlippagePercent): { amountInMax: Wei } {
  const adjusted = ONE.plus(slippage).multipliedBy(new Fraction(amountIn.asBigInt)).quotient.decimalPlaces(0)

  return { amountInMax: new Wei(adjusted) }
}

function amountsTupleToWei(tuple: (string | BigNumber | EthersBigNumber)[]): { amountIn: Wei; amountOut: Wei } {
  const [a, b] = tuple
  return { amountIn: new Wei(a), amountOut: new Wei(b) }
}

export class SwapPure {
  #contracts: CommonContracts

  public constructor(props: { contracts: CommonContracts }) {
    this.#contracts = props.contracts
  }

  protected get contracts() {
    return this.#contracts
  }

  public async getAmounts(props: GetAmountsExactInputProps | GetAmountsExactOutputProps): Promise<AmountsInOut> {
    const router = await this.routerContract()
    const path = props.trade.routePath()

    const raw =
      props.mode === 'exact-in'
        ? await router.getAmountsOut([props.amountIn.asStr, path]).call()
        : await router.getAmountsIn([props.amountOut.asStr, path]).call()

    return amountsTupleToWei(raw)
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

    let tx: TransactionObject<unknown>

    switch (props.mode) {
      case 'exact-tokens-for-tokens': {
        tx = router.swapExactTokensForTokens(
          [props.amountIn.asStr, props.amountOutMin.asStr, path, address, deadline],
          baseOverrides,
        )

        break
      }
      case 'tokens-for-exact-tokens': {
        tx = router.swapTokensForExactTokens(
          [props.amountInMax.asStr, props.amountOut.asStr, path, address, deadline],
          baseOverrides,
        )

        break
      }
      case 'exact-tokens-for-eth': {
        tx = router.swapExactTokensForETH(
          [props.amountIn.asStr, props.amountOutMin.asStr, path, address, deadline],
          baseOverrides,
        )

        break
      }
      case 'exact-eth-for-tokens': {
        tx = router.swapExactETHForTokens([props.amountOutMin.asStr, path, address, deadline], {
          ...baseOverrides,
          value: props.amountIn,
        })

        break
      }
      case 'eth-for-exact-tokens': {
        tx = router.swapETHForExactTokens([props.amountOut.asStr, path, address, deadline], {
          ...baseOverrides,
          value: props.amountInMax,
        })

        break
      }
      case 'tokens-for-exact-eth': {
        tx = router.swapTokensForExactETH(
          [props.amountOut.asStr, props.amountInMax.asStr, path, address, deadline],
          baseOverrides,
        )

        break
      }

      default: {
        const badProps: never = props
        throw new Error(`Bad props: ${String(badProps)}`)
      }
    }

    const { gas, send } = await tx.estimateAndPrepareSend()
    const fee = computeTransactionFee(gasPrice, gas)

    return { fee, send }
  }

  private async approveAmountForSwap(props: SwapProps): Promise<void> {
    const inputToken = props.trade.route.input.address

    const amountForApprove = props.expertMode
      ? new Wei(MAX_UINT256)
      : isSwapExactInput(props)
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
          "amountOutMin": "9950249",
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
}
