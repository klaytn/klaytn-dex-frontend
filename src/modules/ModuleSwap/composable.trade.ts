import { TokenImpl, TokenAmount, Trade, Pair, Wei } from '@/core'
import { BestTradePropsBase, BestTradeProps } from '@/core/entities/Trade'
import { TokensPair, TokenType } from '@/utils/pair'
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

export type UseTradeResult =
  | {
      kind: 'empty'
    }
  | {
      kind: 'exist'
      trade: Trade
    }

export function useTrade(props: UseTradeProps): ComputedRef<UseTradeResult | null> {
  return computed(() => {
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

      if (!trade) return { kind: 'empty' }

      return {
        trade,
        kind: 'exist',
      }
    } catch (err) {
      console.error('Failed to compute trade:', err)
      return { kind: 'empty' }
    }
  })
}
