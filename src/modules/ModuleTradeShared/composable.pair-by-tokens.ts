import { Address, isEmptyAddress, ValueWei } from '@/core/kaikas'
import { TokensPair } from '@/utils/pair'
import { Ref } from 'vue'

export type PairAddressResult =
  | {
      kind: 'empty'
      tokens: TokensPair<Address>
    }
  | {
      kind: 'exist'
      addr: Address
      tokens: TokensPair<Address>
      totalSupply: ValueWei<string>
      userBalance: ValueWei<string>
    }

export function usePairAddress(tokens: TokensPair<Address | null | undefined>): {
  pending: Ref<boolean>
  pair: Ref<null | PairAddressResult>
} {
  const kaikasStore = useKaikasStore()

  const scope = useScopeWithAdvancedKey(
    computed(() => {
      const { tokenA, tokenB } = tokens
      if (tokenA && tokenB) return { key: `${tokenA}-${tokenB}`, payload: { tokenA, tokenB } }
      return null
    }),
    (actualTokens) => {
      const kaikas = kaikasStore.getKaikasAnyway()

      const { run, state } = useTask<PairAddressResult>(async () => {
        const addr = await kaikas.tokens.getPairAddress(actualTokens)
        const isEmpty = isEmptyAddress(addr)
        if (isEmpty) return { kind: 'empty', tokens: actualTokens }

        const { totalSupply, userBalance } = await kaikas.tokens.getPairBalanceOfUser(actualTokens)
        return {
          kind: 'exist',
          addr,
          totalSupply,
          userBalance,
          tokens: actualTokens,
        }
      })
      run()
      usePromiseLog(state, 'pair-addr')

      return state
    },
  )

  const pending = computed(() => scope.value?.expose.pending ?? false)
  const pair = computed(() => scope.value?.expose.fulfilled?.value ?? null)

  return { pending, pair }
}
