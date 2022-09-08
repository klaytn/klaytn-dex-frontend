import Pair from './Pair'
import Percent from './Percent'
import Price from './Price'
import Route from './Route'
import TokenAmount from './TokenAmount'
import TokenImpl from './TokenImpl'

import { UniTrade, UniTradeType, UniToken } from './uni-entities'

export type TradeType = 'exact-in' | 'exact-out'

const TRADE_CONST_PROPS = {
  maxHops: 3,
  maxNumResults: 1,
} as const

export default class Trade {
  public static bestTradeExactIn(pairs: Pair[], amountIn: TokenAmount, tokenOut: TokenImpl): null | Trade {
    const trade = UniTrade.bestTradeExactIn(
      pairs.map((x) => x.toUni()),
      amountIn.toUni(),
      tokenOut.toUni(),
      TRADE_CONST_PROPS,
    ).at(0)

    return trade ? Trade.fromUniTrade(trade) : null
  }

  public static bestTradeExactOut(pairs: Pair[], tokenIn: TokenImpl, amountOut: TokenAmount): null | Trade {
    const trade = UniTrade.bestTradeExactOut(
      pairs.map((x) => x.toUni()),
      tokenIn.toUni(),
      amountOut.toUni(),
      TRADE_CONST_PROPS,
    ).at(0)

    return trade ? Trade.fromUniTrade(trade) : null
  }

  private static fromUniTrade(trade: UniTrade<UniToken, UniToken, any>): Trade {
    return new Trade({
      route: Route.fromUniRoute(trade.route),
      tradeType: trade.tradeType === UniTradeType.EXACT_INPUT ? 'exact-in' : 'exact-out',
      inputAmount: TokenAmount.fromUni(trade.inputAmount),
      outputAmount: TokenAmount.fromUni(trade.outputAmount),
      executionPrice: Price.fromUni(trade.executionPrice),
      priceImpact: new Percent(trade.priceImpact.numerator.toString(), trade.priceImpact.denominator.toString()),
    })
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
