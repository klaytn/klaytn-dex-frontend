import { TokenImpl, TokenAmount, Trade, Pair, Wei } from '@/core'
import { TokensPair, TokenType } from '@/utils/pair'
import { MaybeRef } from '@vueuse/core'
import { ComputedRef } from 'vue'

interface UseTradeProps {
  tokens: TokensPair<TokenImpl | null>
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

    try {
      // FIXME it usually takes 60-70ms. Move to Worker?
      const trade =
        amountFor === 'tokenB'
          ? Trade.bestTradeExactIn(pairs, TokenAmount.fromWei(inputToken, amountWei), outputToken)
          : Trade.bestTradeExactOut(pairs, inputToken, TokenAmount.fromWei(outputToken, amountWei))

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
