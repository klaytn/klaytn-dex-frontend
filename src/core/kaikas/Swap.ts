import { type ValueWei, type Address, type Deadline } from './types'
import Config from './Config'
import { MAGIC_GAS_PRICE } from './const'
import BN from 'bn.js'
import { deadlineFiveMinutesFromNow } from './utils'

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

export type AmountValue = ValueWei<string | number | BN>

export interface SwapExactAForB<A extends string, B extends string> {
  mode: `exact-${A}-for-${B}`
  amountIn: AmountValue
  amountOutMin: AmountValue
}

export interface SwapAForExactB<A extends string, B extends string> {
  mode: `${A}-for-exact-${B}`
  amountOut: AmountValue
  amountInMax: AmountValue
}

export type SwapExactForAndForExact<A extends string, B extends string> = SwapAForExactB<A, B> | SwapExactAForB<A, B>

export type SwapProps = SwapPropsBase &
  (
    | SwapExactForAndForExact<'tokens', 'tokens'>
    | SwapExactForAndForExact<'tokens', 'eth'>
    | SwapExactForAndForExact<'eth', 'tokens'>
  )

export interface SwapResult {
  gas: ValueWei<number>
  send: () => Promise<unknown>
}

interface GetAmountsInProps extends AddrsPair {
  mode: 'in'
  amountOut: AmountValue
}

interface GetAmountsOutProps extends AddrsPair {
  mode: 'out'
  amountIn: AmountValue
}

type GetAmountsProps = GetAmountsInProps | GetAmountsOutProps

export default class Swap {
  private readonly cfg: Config

  public constructor(cfg: Config) {
    this.cfg = cfg
  }

  private get addr() {
    return this.cfg.addrs.self
  }

  private get routerMethods() {
    return this.cfg.contracts.router.methods
  }

  public async getAmounts(props: GetAmountsProps): Promise<[ValueWei<string>, ValueWei<string>]> {
    const path = [props.addressA, props.addressB]
    const amounts = await (props.mode === 'in'
      ? this.routerMethods.getAmountsIn(props.amountOut, path)
      : this.routerMethods.getAmountsOut(props.amountIn, path)
    ).call()
    return amounts as [ValueWei<string>, ValueWei<string>]
  }

  // TODO prepare swap
  public async swap(props: SwapProps): Promise<SwapResult> {
    const routerMethods = this.cfg.contracts.router.methods
    const deadline = props.deadline ?? deadlineFiveMinutesFromNow()
    let gas: number
    let send: () => Promise<unknown>

    switch (props.mode) {
      case 'exact-tokens-for-tokens': {
        const swapMethod = routerMethods.swapExactTokensForTokens(
          props.amountIn,
          props.amountOutMin,
          [props.addressA, props.addressB],
          this.addr,
          deadline,
        )
        gas = await swapMethod.estimateGas()
        send = () =>
          swapMethod.send({
            from: this.addr,
            gas,
            gasPrice: MAGIC_GAS_PRICE,
          })

        break
      }
      case 'tokens-for-exact-tokens': {
        const swapMethod = routerMethods.swapTokensForExactTokens(
          props.amountOut,
          props.amountInMax,
          [props.addressA, props.addressB],
          this.addr,
          deadline,
        )
        gas = await swapMethod.estimateGas()
        send = () =>
          swapMethod.send({
            from: this.addr,
            gas,
            gasPrice: MAGIC_GAS_PRICE,
          })

        break
      }
      case 'exact-tokens-for-eth': {
        const swapMethod = routerMethods.swapExactTokensForETH(
          props.amountIn,
          props.amountOutMin,
          [props.addressA, props.addressB],
          this.addr,
          deadline,
        )
        gas = await swapMethod.estimateGas({
          from: this.addr,
          gasPrice: MAGIC_GAS_PRICE,
        })
        send = () =>
          swapMethod.send({
            from: this.addr,
            gas,
            gasPrice: MAGIC_GAS_PRICE,
          })

        break
      }
      case 'exact-eth-for-tokens': {
        const swapMethod = routerMethods.swapExactETHForTokens(
          props.amountOutMin,
          [props.addressA, props.addressB],
          this.addr,
          deadline,
        )
        gas = await swapMethod.estimateGas({
          // FIXME?
          value: props.amountIn,
          from: this.addr,
          gasPrice: MAGIC_GAS_PRICE,
        })
        send = () =>
          swapMethod.send({
            value: props.amountIn,
            from: this.addr,
            gas,
            gasPrice: MAGIC_GAS_PRICE,
          })

        break
      }
      case 'eth-for-exact-tokens': {
        const swapMethod = routerMethods.swapETHForExactTokens(
          props.amountOut,
          [props.addressA, props.addressB],
          this.addr,
          deadline,
        )
        gas = await swapMethod.estimateGas({
          value: props.amountInMax,
          from: this.addr,
          gasPrice: MAGIC_GAS_PRICE,
        })
        send = () =>
          swapMethod.send({
            value: props.amountInMax,
            gas,
            from: this.addr,
            gasPrice: MAGIC_GAS_PRICE,
          })

        break
      }
      case 'tokens-for-exact-eth': {
        const swapMethod = routerMethods.swapTokensForExactETH(
          props.amountOut,
          props.amountInMax,
          [props.addressA, props.addressB],
          this.addr,
          deadline,
        )
        gas = await swapMethod.estimateGas({
          from: this.addr,
          gasPrice: MAGIC_GAS_PRICE,
        })
        send = () =>
          swapMethod.send({
            gas,
            from: this.addr,
            gasPrice: MAGIC_GAS_PRICE,
          })

        break
      }

      default: {
        const badProps: never = props
        throw new Error(`Bad props: ${String(badProps)}`)
      }
    }

    return {
      gas: gas as ValueWei<number>,
      send,
    }
  }
}
