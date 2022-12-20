import { Pair, TokenAmount, TokenImpl, Trade, Wei } from '@/core'
import { BestTradeProps, BestTradePropsBase, BestTradeResult } from '@/core/entities/Trade'
import { TokenType, TokensPair } from '@/utils/pair'
import { MaybeRef } from '@vueuse/core'
import { ComputedRef } from 'vue'
import Debug from 'debug'

const debug = Debug('swap-trade')

interface UseTradeProps {
  tokens: TokensPair<TokenImpl | null>
  disableMultiHops: MaybeRef<boolean>
  pairs: MaybeRef<Pair[] | null>
  amount: MaybeRef<{
    for: TokenType
    wei: Wei
  } | null>
}

export function useTrade(props: UseTradeProps): ComputedRef<BestTradeResult | null> {
  return computed((): null | BestTradeResult => {
    const pairs = unref(props.pairs)
    const { tokenA: inputToken, tokenB: outputToken } = props.tokens
    const { for: amountFor, wei: amountWei } = unref(props.amount) ?? {}

    if (!pairs || !inputToken || !outputToken || !amountWei || !amountFor) return null

    const baseProps: BestTradePropsBase = { pairs, disableMultiHops: unref(props.disableMultiHops) }
    const tradeProps: BestTradeProps =
      amountFor === 'tokenB'
        ? {
            tradeType: 'exact-in',
            amountIn: TokenAmount.fromWei(inputToken, amountWei),
            tokenOut: outputToken,
            ...baseProps,
          }
        : {
            tradeType: 'exact-out',
            amountOut: TokenAmount.fromWei(outputToken, amountWei),
            tokenIn: inputToken,
            ...baseProps,
          }

    debug('computing trade with props: %o', tradeProps)

    try {
      // TODO move to worker?
      const trade = Trade.bestTrade(tradeProps)
      debug('computed trade: %o', trade)
      return trade
    } catch (err) {
      console.error('Failed to compute trade:', err)
      return { kind: 'route-not-found' }
    }
  })
}
