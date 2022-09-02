import { TokenAmount, TokenImpl, Wei } from '@/core'
import { buildPair, TokensPair } from '@/utils/pair'
import { Ref } from 'vue'

export function useTokenAmounts(
  props: TokensPair<{ token: TokenImpl; amount: Wei } | null>,
): Ref<TokensPair<TokenAmount> | null> {
  return computed(() => {
    if (!props.tokenA || !props.tokenB) return null
    return buildPair((type) => TokenAmount.fromWei(props[type]!.token, props[type]!.amount))
  })
}
