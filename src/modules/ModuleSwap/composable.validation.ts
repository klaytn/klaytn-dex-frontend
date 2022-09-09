import { Wei, Token } from '@/core'
import { Ref } from 'vue'
import { UseTradeResult } from './composable.trade'

export function useSwapValidation({
  tokenA,
  tokenB,
  trade,
}: {
  tokenA: Ref<(Token & { balance: Wei; input: Wei }) | null>
  tokenB: Ref<Token | null>
  trade: Ref<Pick<UseTradeResult, 'kind'> | null>
}): Ref<{ kind: 'ok' } | { kind: 'err'; message: string }> {
  const err = (message: string) => ({ kind: 'err' as const, message })

  return computed(() => {
    if (!tokenA.value || !tokenB.value) return err('Select Token')

    if (!trade.value) {
      return err('Route is not computed yet')
    }

    if (trade.value.kind === 'empty') {
      return err(`Route ${tokenA.value.symbol} > ${tokenB.value.symbol} not found`)
    }

    if (tokenA.value.balance.asBigInt < tokenA.value.input.asBigInt) {
      return err(`Insufficient ${tokenA.value.symbol} balance`)
    }

    return { kind: 'ok' }
  })
}
