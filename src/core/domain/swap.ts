import type { Deadline } from '../types'
import { computeTransactionFee, deadlineFiveMinutesFromNow } from '../utils'
import { Fraction, Trade, Wei, Percent } from '../entities'
import CommonContracts from './CommonContracts'
import { Agent } from './agent'
import { TransactionObject, IsomorphicOverrides } from '../isomorphic-contract'
import invariant from 'tiny-invariant'

interface HasTrade {
  trade: Trade
}

export interface SwapPropsBase extends HasTrade {
  /**
   * By default it is 5 minutes from now.
   */
  deadline?: Deadline
  /**
   * @defualt 0
   */
  allowedSlippage?: Percent
}

export interface SwapExactAForB<A extends string, B extends string> {
  mode: `exact-${A}-for-${B}`
  amountIn: Wei
  amountOutMin: Wei
}

export interface SwapAForExactB<A extends string, B extends string> {
  mode: `${A}-for-exact-${B}`
  amountOut: Wei
  amountInMax: Wei
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

interface GetAmountsInProps extends HasTrade {
  mode: 'in'
  amountOut: Wei
}

interface GetAmountsOutProps extends HasTrade {
  mode: 'out'
  amountIn: Wei
}

type GetAmountsProps = GetAmountsInProps | GetAmountsOutProps

const ZERO = new Fraction(0)
const ONE = new Fraction(1)

function applySlippage(props: SwapPropsAmounts & Pick<SwapPropsBase, 'allowedSlippage'>): {
  amountIn: Wei
  amountOut: Wei
} {
  const slippage = props.allowedSlippage ?? new Percent(0)
  invariant(!slippage.isLessThan(ZERO), () => `Slippage should be a non-negative number, got: ${slippage.toFixed()}`)

  let amountIn: Wei
  let amountOut: Wei

  if (isSwapExactInput(props)) {
    amountIn = props.amountIn

    const adjusted = ONE.plus(slippage)
      .invert()
      .multipliedBy(new Fraction(props.amountOutMin.asBigInt))
      .quotient.decimalPlaces(0)
    amountOut = new Wei(adjusted)
  } else {
    amountOut = props.amountOut

    const adjusted = ONE.plus(slippage).multipliedBy(new Fraction(props.amountInMax.asBigInt)).quotient.decimalPlaces(0)
    amountIn = new Wei(adjusted)
  }

  return { amountIn, amountOut }
}

export class SwapPure {
  #contracts: CommonContracts

  public constructor(props: { contracts: CommonContracts }) {
    this.#contracts = props.contracts
  }

  protected get contracts() {
    return this.#contracts
  }

  public async getAmounts(props: GetAmountsProps): Promise<[Wei, Wei]> {
    const router = this.#contracts.get('router') || (await this.#contracts.init('router'))

    const path = props.trade.routePath()
    const [amount0, amount1] = await (props.mode === 'in'
      ? router.getAmountsIn([props.amountOut.asStr, path]).call()
      : router.getAmountsOut([props.amountIn.asStr, path]).call())
    return [new Wei(amount0), new Wei(amount1)]
  }
}

export class Swap extends SwapPure {
  #agent: Agent

  public constructor(props: { agent: Agent; contracts: CommonContracts }) {
    super(props)
    this.#agent = props.agent
  }

  public async prepareSwap(props: SwapProps): Promise<SwapResult> {
    const router = this.contracts.get('router') || (await this.contracts.init('router'))

    const { deadline = deadlineFiveMinutesFromNow() } = props
    const { address } = this.#agent
    const path = props.trade.routePath()

    const {
      amountIn: amountInAsWei,
      amountOut: { asStr: amountOut },
    } = applySlippage(props)
    const amountIn = amountInAsWei.asStr

    const gasPrice = await this.#agent.getGasPrice()
    const baseOverrides: IsomorphicOverrides = {
      gasPrice,
      from: address,
    }

    let tx: TransactionObject<unknown>

    switch (props.mode) {
      case 'exact-tokens-for-tokens': {
        tx = router.swapExactTokensForTokens([amountIn, amountOut, path, address, deadline], baseOverrides)

        break
      }
      case 'tokens-for-exact-tokens': {
        tx = router.swapTokensForExactTokens([amountIn, amountOut, path, address, deadline], baseOverrides)

        break
      }
      case 'exact-tokens-for-eth': {
        tx = router.swapExactTokensForETH([amountIn, amountOut, path, address, deadline], baseOverrides)

        break
      }
      case 'exact-eth-for-tokens': {
        tx = router.swapExactETHForTokens([amountOut, path, address, deadline], {
          ...baseOverrides,
          value: amountInAsWei,
        })

        break
      }
      case 'eth-for-exact-tokens': {
        tx = router.swapETHForExactTokens([amountOut, path, address, deadline], {
          ...baseOverrides,
          value: amountInAsWei,
        })

        break
      }
      case 'tokens-for-exact-eth': {
        tx = router.swapTokensForExactETH([amountOut, amountIn, path, address, deadline], baseOverrides)

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
}

if (import.meta.vitest) {
  const { test, expect, describe } = import.meta.vitest

  describe('applySlippage', () => {
    test('0 slippage, exact input', () => {
      expect(
        applySlippage({
          mode: 'exact-eth-for-tokens',
          amountIn: new Wei(10000000n),
          amountOutMin: new Wei(1000000000n),
        }),
      ).toMatchInlineSnapshot(`
        {
          "amountIn": "10000000",
          "amountOut": "1000000000",
        }
      `)
    })

    test('0.5% slippage, exact input', () => {
      expect(
        applySlippage({
          mode: 'exact-tokens-for-tokens',
          amountIn: new Wei(10000000n),
          amountOutMin: new Wei(1000000000n),
          allowedSlippage: new Percent(5, 1000),
        }),
      ).toMatchInlineSnapshot(`
        {
          "amountIn": "10000000",
          "amountOut": "995024876",
        }
      `)
    })

    test('2.5% slippage, exact output', () => {
      expect(
        applySlippage({
          mode: 'tokens-for-exact-eth',
          amountInMax: new Wei(10000000n),
          amountOut: new Wei(1000000000n),
          allowedSlippage: new Percent(25, 1000),
        }),
      ).toMatchInlineSnapshot(`
        {
          "amountIn": "10250000",
          "amountOut": "1000000000",
        }
      `)
    })
  })
}
