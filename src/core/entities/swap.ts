import type { Address, Deadline } from '../types'
import {
  computeTransactionFee,
  deadlineFiveMinutesFromNow,
  UniContractMethod,
  universalizeContractMethod,
} from '../utils'
import Wei from './Wei'
import CommonContracts from './CommonContracts'
import { Agent } from './agent'

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

  protected get router() {
    return this.#contracts.router
  }

  public async getAmounts(props: GetAmountsProps): Promise<[Wei, Wei]> {
    const path = [props.addressA, props.addressB]
    const [amount0, amount1] = await (props.mode === 'in'
      ? this.router.getAmountsIn(props.amountOut.asBigInt, path)
      : this.router.getAmountsOut(props.amountIn.asBigInt, path))
    return [new Wei(amount0), new Wei(amount1)]
  }
}

export class Swap extends SwapAnon {
  #agent: Agent

  public constructor(props: { agent: Agent; contracts: CommonContracts }) {
    super(props)
    this.#agent = props.agent
  }

  public async swap(props: SwapProps): Promise<SwapResult> {
    const { deadline = deadlineFiveMinutesFromNow() } = props
    const { router } = this
    const { address } = this.#agent
    const gasPrice = await this.#agent.getGasPrice()

    let method: UniContractMethod

    switch (props.mode) {
      case 'exact-tokens-for-tokens': {
        method = universalizeContractMethod(router, 'swapExactTokensForTokens', [
          props.amountIn.asBigInt,
          props.amountOutMin.asBigInt,
          [props.addressA, props.addressB],
          address,
          deadline,
        ])

        break
      }
      case 'tokens-for-exact-tokens': {
        method = universalizeContractMethod(router, 'swapTokensForExactTokens', [
          // FIXME?
          props.amountInMax.asBigInt,
          props.amountOut.asBigInt,
          [props.addressA, props.addressB],
          address,
          deadline,
        ])

        break
      }
      case 'exact-tokens-for-eth': {
        method = universalizeContractMethod(router, 'swapExactTokensForETH', [
          props.amountIn.asBigInt,
          props.amountOutMin.asBigInt,
          [props.addressA, props.addressB],
          address,
          deadline,
        ])

        break
      }
      case 'exact-eth-for-tokens': {
        method = universalizeContractMethod(router, 'swapExactETHForTokens', [
          props.amountOutMin.asStr,
          [props.addressA, props.addressB],
          address,
          deadline,
        ])

        break
      }
      case 'eth-for-exact-tokens': {
        method = universalizeContractMethod(router, 'swapETHForExactTokens', [
          props.amountOut.asStr,
          [props.addressA, props.addressB],
          address,
          deadline,
        ])

        break
      }
      case 'tokens-for-exact-eth': {
        method = universalizeContractMethod(router, 'swapTokensForExactETH', [
          props.amountOut.asStr,
          props.amountInMax.asStr,
          [props.addressA, props.addressB],
          address,
          deadline,
        ])

        break
      }

      default: {
        const badProps: never = props
        throw new Error(`Bad props: ${String(badProps)}`)
      }
    }

    const { estimateGas, send } = method
    const gas = await estimateGas()
    const fee = computeTransactionFee(gasPrice, gas)

    return {
      fee,
      send,
    }
  }
}
