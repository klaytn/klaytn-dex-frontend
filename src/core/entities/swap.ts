import type { Address, Deadline } from '../types'
import { computeTransactionFee, deadlineFiveMinutesFromNow } from '../utils'
import Wei from './Wei'
import CommonContracts from './CommonContracts'
import { Agent } from './agent'
import { TransactionObject, IsomorphicOverrides } from './isomorphic-contract'

export interface AddrsPair {
  addressA: Address
  addressB: Address
}

export interface SwapPropsBase extends AddrsPair {
  /**
   * By default it is 5 minutes from now.
   */
  deadline?: Deadline
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

export type SwapProps = SwapPropsBase &
  (
    | SwapExactForAndForExact<'tokens', 'tokens'>
    | SwapExactForAndForExact<'tokens', 'eth'>
    | SwapExactForAndForExact<'eth', 'tokens'>
  )

export interface SwapResult {
  fee: Wei
  send: () => Promise<unknown>
}

interface GetAmountsInProps extends AddrsPair {
  mode: 'in'
  amountOut: Wei
}

interface GetAmountsOutProps extends AddrsPair {
  mode: 'out'
  amountIn: Wei
}

type GetAmountsProps = GetAmountsInProps | GetAmountsOutProps

export class SwapAnon {
  #contracts: CommonContracts

  public constructor(props: { contracts: CommonContracts }) {
    this.#contracts = props.contracts
  }

  protected get contracts() {
    return this.#contracts
  }

  public async getAmounts(props: GetAmountsProps): Promise<[Wei, Wei]> {
    const router = this.#contracts.get('router') || (await this.#contracts.init('router'))

    const path = [props.addressA, props.addressB]
    const [amount0, amount1] = await (props.mode === 'in'
      ? router.getAmountsIn([props.amountOut.asStr, path]).call()
      : router.getAmountsOut([props.amountIn.asStr, path]).call())
    return [new Wei(amount0), new Wei(amount1)]
  }
}

export class Swap extends SwapAnon {
  #agent: Agent

  public constructor(props: { agent: Agent; contracts: CommonContracts }) {
    super(props)
    this.#agent = props.agent
  }

  public async prepareSwap(props: SwapProps): Promise<SwapResult> {
    const router = this.contracts.get('router') || (await this.contracts.init('router'))

    const { deadline = deadlineFiveMinutesFromNow() } = props
    const { address } = this.#agent

    const gasPrice = await this.#agent.getGasPrice()
    const baseOverrides: IsomorphicOverrides = {
      gasPrice,
      from: address,
    }

    let tx: TransactionObject<unknown>

    switch (props.mode) {
      case 'exact-tokens-for-tokens': {
        tx = router.swapExactTokensForTokens(
          [props.amountIn.asStr, props.amountOutMin.asStr, [props.addressA, props.addressB], address, deadline],
          baseOverrides,
        )

        break
      }
      case 'tokens-for-exact-tokens': {
        tx = router.swapTokensForExactTokens(
          [props.amountInMax.asStr, props.amountOut.asStr, [props.addressA, props.addressB], address, deadline],
          baseOverrides,
        )

        break
      }
      case 'exact-tokens-for-eth': {
        tx = router.swapExactTokensForETH(
          [props.amountIn.asStr, props.amountOutMin.asStr, [props.addressA, props.addressB], address, deadline],
          baseOverrides,
        )

        break
      }
      case 'exact-eth-for-tokens': {
        tx = router.swapExactETHForTokens(
          [props.amountOutMin.asStr, [props.addressA, props.addressB], address, deadline],
          { ...baseOverrides, value: props.amountIn },
        )

        break
      }
      case 'eth-for-exact-tokens': {
        tx = router.swapETHForExactTokens(
          [props.amountOut.asStr, [props.addressA, props.addressB], address, deadline],
          { ...baseOverrides, value: props.amountInMax },
        )

        break
      }
      case 'tokens-for-exact-eth': {
        tx = router.swapTokensForExactETH(
          [props.amountOut.asStr, props.amountInMax.asStr, [props.addressA, props.addressB], address, deadline],
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
}
