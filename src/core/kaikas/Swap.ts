import type { Deadline } from './types'
import Config from './Config'
import { MAGIC_GAS_PRICE } from './const'
import { computeTransactionFee, deadlineFiveMinutesFromNow } from './utils'
import Wei from './entities/Wei'
import { Route } from './entities'

export interface SwapPropsBase {
  route: Route
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

interface GetAmountsInProps {
  mode: 'in'
  amountOut: Wei
  route: Route
}

interface GetAmountsOutProps {
  mode: 'out'
  amountIn: Wei
  route: Route
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

  public async getAmounts(props: GetAmountsProps): Promise<[Wei, Wei]> {
    const path = props.route.path.map((token) => token.address)
    console.log(path)
    const amounts = await (props.mode === 'in'
      ? this.routerMethods.getAmountsIn(props.amountOut.asStr, path)
      : this.routerMethods.getAmountsOut(props.amountIn.asStr, path)
    ).call()
    return [new Wei(amounts.at(0)!), new Wei(amounts.at(-1)!)]
  }

  // TODO prepare swap
  public async swap(props: SwapProps): Promise<SwapResult> {
    const routerMethods = this.cfg.contracts.router.methods
    const deadline = props.deadline ?? deadlineFiveMinutesFromNow()
    const gasPrice = MAGIC_GAS_PRICE
    let gas: number
    let send: () => Promise<unknown>

    const path = props.route.path.map((token) => token.address)

    switch (props.mode) {
      case 'exact-tokens-for-tokens': {
        const swapMethod = routerMethods.swapExactTokensForTokens(
          props.amountIn.asStr,
          props.amountOutMin.asStr,
          path,
          this.addr,
          deadline,
        )
        gas = await swapMethod.estimateGas()
        send = () =>
          swapMethod.send({
            from: this.addr,
            gas,
            gasPrice: gasPrice.asStr,
          })

        break
      }
      case 'tokens-for-exact-tokens': {
        const swapMethod = routerMethods.swapTokensForExactTokens(
          // FIXME?
          props.amountInMax.asStr,
          props.amountOut.asStr,
          path,
          this.addr,
          deadline,
        )
        gas = await swapMethod.estimateGas()
        send = () =>
          swapMethod.send({
            from: this.addr,
            gas,
            gasPrice: gasPrice.asStr,
          })

        break
      }
      case 'exact-tokens-for-eth': {
        const swapMethod = routerMethods.swapExactTokensForETH(
          props.amountIn.asStr,
          props.amountOutMin.asStr,
          path,
          this.addr,
          deadline,
        )
        gas = await swapMethod.estimateGas({
          from: this.addr,
          gasPrice: gasPrice.asStr,
        })
        send = () =>
          swapMethod.send({
            from: this.addr,
            gas,
            gasPrice: gasPrice.asStr,
          })

        break
      }
      case 'exact-eth-for-tokens': {
        const swapMethod = routerMethods.swapExactETHForTokens(props.amountOutMin.asStr, path, this.addr, deadline)
        gas = await swapMethod.estimateGas({
          // FIXME?
          value: props.amountIn.asStr,
          from: this.addr,
          gasPrice: gasPrice.asStr,
        })
        send = () =>
          swapMethod.send({
            value: props.amountIn.asStr,
            from: this.addr,
            gas,
            gasPrice: gasPrice.asStr,
          })

        break
      }
      case 'eth-for-exact-tokens': {
        const swapMethod = routerMethods.swapETHForExactTokens(props.amountOut.asStr, path, this.addr, deadline)
        gas = await swapMethod.estimateGas({
          value: props.amountInMax.asStr,
          from: this.addr,
          gasPrice: gasPrice.asStr,
        })
        send = () =>
          swapMethod.send({
            value: props.amountInMax.asStr,
            gas,
            from: this.addr,
            gasPrice: gasPrice.asStr,
          })

        break
      }
      case 'tokens-for-exact-eth': {
        const swapMethod = routerMethods.swapTokensForExactETH(
          props.amountOut.asStr,
          props.amountInMax.asStr,
          path,
          this.addr,
          deadline,
        )
        gas = await swapMethod.estimateGas({
          from: this.addr,
          gasPrice: gasPrice.asStr,
        })
        send = () =>
          swapMethod.send({
            gas,
            from: this.addr,
            gasPrice: gasPrice.asStr,
          })

        break
      }

      default: {
        const badProps: never = props
        throw new Error(`Bad props: ${String(badProps)}`)
      }
    }

    const fee = computeTransactionFee(gasPrice, gas)

    return {
      fee,
      send,
    }
  }
}
