import Pair from './Pair'
import Percent from './Percent'
import Price from './Price'
import Route from './Route'
import TokenAmount from './TokenAmount'
import TokenImpl from './TokenImpl'

import { UniTrade, UniTradeType, UniToken } from './uni-entities'

export type TradeType = 'exact-in' | 'exact-out'

export interface BestTradePropsBase {
  maxHops: number
  maxNumResults: number
  pairs: Pair[]
}

interface BestTradePropsIn extends BestTradePropsBase {
  tradeType: 'exact-in'
  amountIn: TokenAmount
  tokenOut: TokenImpl
}

interface BestTradePropsOut extends BestTradePropsBase {
  tradeType: 'exact-out'
  tokenIn: TokenImpl
  amountOut: TokenAmount
}

type BestTradeProps = BestTradePropsOut | BestTradePropsIn

export default class Trade {
  public static bestTrade(props: BestTradeProps): Trade[] {
    const { maxHops, pairs, maxNumResults } = props
    const options = { maxHops, maxNumResults }
    const pairsUni = pairs.map((x) => x.toUni())

    const trades =
      props.tradeType === 'exact-in'
        ? UniTrade.bestTradeExactIn(pairsUni, props.amountIn.toUni(), props.tokenOut.toUni(), options)
        : UniTrade.bestTradeExactOut(pairsUni, props.tokenIn.toUni(), props.amountOut.toUni(), options)

    return trades.map(
      (trade) =>
        new Trade({
          route: Route.fromUniRoute(trade.route),
          tradeType: trade.tradeType === UniTradeType.EXACT_INPUT ? 'exact-in' : 'exact-out',
          inputAmount: TokenAmount.fromUni(trade.inputAmount),
          outputAmount: TokenAmount.fromUni(trade.outputAmount),
          executionPrice: Price.fromUni(trade.executionPrice),
          priceImpact: new Percent(trade.priceImpact.numerator.toString(), trade.priceImpact.denominator.toString()),
        }),
    )
  }

  public readonly route!: Route
  public readonly tradeType!: TradeType
  public readonly inputAmount!: TokenAmount
  public readonly outputAmount!: TokenAmount
  public readonly executionPrice!: Price
  public readonly priceImpact!: Percent

  protected constructor(
    props: Pick<Trade, 'executionPrice' | 'inputAmount' | 'outputAmount' | 'priceImpact' | 'route' | 'tradeType'>,
  ) {
    Object.assign(this, props)
  }
}
