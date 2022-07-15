import { ValueWei, Token } from '@/core/kaikas'
import BigNumber from 'bignumber.js'
import { Ref } from 'vue'
import { PairAddressResult } from '../ModuleTradeShared/composable.pair-by-tokens'

export function useSwapValidation({
  tokenA,
  tokenB,
  pairAddr,
}: {
  tokenA: Ref<(Token & { balance: ValueWei<BigNumber>; input: ValueWei<string> }) | null>
  tokenB: Ref<Token | null>
  pairAddr: Ref<PairAddressResult | null>
}): Ref<{ kind: 'ok' } | { kind: 'err'; message: string }> {
  const err = (message: string) => ({ kind: 'err' as const, message })

  return computed(() => {
    if (!tokenA.value || !tokenB.value) return err('Select Token')

    if (!pairAddr.value) {
      return err('Route is not computed yet')
    }

    if (pairAddr.value.kind === 'empty') {
      return err(`Route ${tokenA.value.symbol}>${tokenB.value.symbol} not found`)
    }

    if (tokenA.value.balance.isLessThan(new BigNumber(tokenA.value.input))) {
      return err(`Insufficient ${tokenA.value.symbol} balance`)
    }

    return { kind: 'ok' }
  })
}
