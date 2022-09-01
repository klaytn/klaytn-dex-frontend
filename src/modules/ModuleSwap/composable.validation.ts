import { Wei, Token } from '@/core'
import { Ref } from 'vue'
import { SwapRouteResult } from './composable.swap-route'

export function useSwapValidation({
  tokenA,
  tokenB,
  route,
}: {
  tokenA: Ref<(Token & { balance: Wei; input: Wei }) | null>
  tokenB: Ref<Token | null>
  route: Ref<SwapRouteResult | null>
}): Ref<{ kind: 'ok' } | { kind: 'err'; message: string }> {
  const err = (message: string) => ({ kind: 'err' as const, message })

  return computed(() => {
    if (!tokenA.value || !tokenB.value) return err('Select Token')

    if (!route.value) {
      return err('Route is not computed yet')
    }

    if (route.value.kind === 'empty') {
      return err(`Route ${tokenA.value.symbol}>${tokenB.value.symbol} not found`)
    }

    if (tokenA.value.balance.asBigInt < tokenA.value.input.asBigInt) {
      return err(`Insufficient ${tokenA.value.symbol} balance`)
    }

    return { kind: 'ok' }
  })
}
