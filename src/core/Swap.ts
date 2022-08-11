import type { Address, Deadline } from './types'
import {
  computeTransactionFee,
  deadlineFiveMinutesFromNow,
  UniContractMethod,
  universalizeContractMethod,
} from './utils'
import Wei from './Wei'
import { UserKlaytnAgent } from './Wallet'
import BaseContracts from './BaseContracts'

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

export default class Swap {
  #wallet: UserKlaytnAgent
  #contracts: BaseContracts
  // private readonly cfg: Config

  public constructor(cfg: Config) {
    this.cfg = cfg
  }

  private get addr() {
    return this.cfg.addrs.self
  }

  private get routerMethods() {
    return this.cfg.contracts.router.methods
  }

  public async getAmounts(props: GetAmountsProps): Promise<[Wei, Wei]> {
    const path = [props.addressA, props.addressB]
    const [amount0, amount1] = await (props.mode === 'in'
      ? this.routerMethods.getAmountsIn(props.amountOut.asStr, path)
      : this.routerMethods.getAmountsOut(props.amountIn.asStr, path)
    ).call()
    return [new Wei(amount0), new Wei(amount1)]
  }

  public async swap(props: SwapProps): Promise<SwapResult> {
    const { router } = this.#contracts
    const { deadline = deadlineFiveMinutesFromNow() } = props
    const gasPrice = await this.#wallet.base.getGasPrice()

    let method: UniContractMethod

    switch (props.mode) {
      case 'exact-tokens-for-tokens': {
        method = universalizeContractMethod(router, 'swapExactTokensForTokens', [
          props.amountIn.asBigInt,
          props.amountOutMin.asBigInt,
          [props.addressA, props.addressB],
          this.addr,
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
          this.addr,
          deadline,
        ])

        break
      }
      case 'exact-tokens-for-eth': {
        method = universalizeContractMethod(router, 'swapExactTokensForETH', [
          props.amountIn.asBigInt,
          props.amountOutMin.asBigInt,
          [props.addressA, props.addressB],
          this.addr,
          deadline,
        ])

        break
      }
      case 'exact-eth-for-tokens': {
        method = universalizeContractMethod(router, 'swapExactETHForTokens', [
          props.amountOutMin.asStr,
          [props.addressA, props.addressB],
          this.addr,
          deadline,
        ])

        break
      }
      case 'eth-for-exact-tokens': {
        method = universalizeContractMethod(router, 'swapETHForExactTokens', [
          props.amountOut.asStr,
          [props.addressA, props.addressB],
          this.addr,
          deadline,
        ])

        break
      }
      case 'tokens-for-exact-eth': {
        method = universalizeContractMethod(router, 'swapTokensForExactETH', [
          props.amountOut.asStr,
          props.amountInMax.asStr,
          [props.addressA, props.addressB],
          this.addr,
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
