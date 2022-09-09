import Pair from './Pair'
import Percent from './Percent'
import Price from './Price'
import Route from './Route'
import TokenAmount from './TokenAmount'
import TokenImpl from './TokenImpl'
import { TRADE_MAX_HOPS, TRADE_MAX_NUM_RESULTS, TRADE_MAX_PRICE_IMPACT } from '../const'
import { Address } from '../types'

import { UniTrade, UniTradeType, UniBestTradeOptions, UniToken, UniFraction } from './uni-entities'

type UniTradeWithUniTokens = UniTrade<UniToken, UniToken, any>

export type TradeType = 'exact-in' | 'exact-out'

const MAX_PRICE_IMPACT_AS_UNI_FRACTION = new UniFraction(
  TRADE_MAX_PRICE_IMPACT.numerator.toString(),
  TRADE_MAX_PRICE_IMPACT.denominator.toString(),
)

export interface BestTradePropsBase {
  disableMultiHops?: boolean
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

export type BestTradeProps = BestTradePropsOut | BestTradePropsIn

export default class Trade {
  public static bestTrade(props: BestTradeProps): null | Trade {
    const { pairs, disableMultiHops } = props
    const options: UniBestTradeOptions = {
      maxHops: disableMultiHops ? 1 : TRADE_MAX_HOPS,
      maxNumResults: TRADE_MAX_NUM_RESULTS,
    }
    const pairsUni = pairs.map((x) => x.toUni())

    const trades: UniTradeWithUniTokens[] =
      props.tradeType === 'exact-in'
        ? UniTrade.bestTradeExactIn(pairsUni, props.amountIn.toUni(), props.tokenOut.toUni(), options)
        : UniTrade.bestTradeExactOut(pairsUni, props.tokenIn.toUni(), props.amountOut.toUni(), options)

    const trade = trades.find((x) => x.priceImpact.lessThan(MAX_PRICE_IMPACT_AS_UNI_FRACTION))
    if (!trade) return null
    return new Trade(trade)
  }

  public readonly route: Route
  public readonly tradeType: TradeType
  public readonly inputAmount: TokenAmount
  public readonly outputAmount: TokenAmount
  public readonly executionPrice: Price
  public readonly priceImpact: Percent

  protected constructor(trade: UniTradeWithUniTokens) {
    this.route = Route.fromUniRoute(trade.route)
    this.tradeType = trade.tradeType === UniTradeType.EXACT_INPUT ? 'exact-in' : 'exact-out'
    this.inputAmount = TokenAmount.fromUni(trade.inputAmount)
    this.outputAmount = TokenAmount.fromUni(trade.outputAmount)
    this.executionPrice = Price.fromUni(trade.executionPrice)
    this.priceImpact = new Percent(trade.priceImpact.numerator.toString(), trade.priceImpact.denominator.toString())
  }

  public routePath(): Address[] {
    return this.route.path.map((x) => x.address)
  }
}
