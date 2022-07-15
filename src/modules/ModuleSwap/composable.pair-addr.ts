import { Address, isEmptyAddress, ValueWei } from '@/core/kaikas'
import { TokensPair } from '@/utils/pair'
import { Ref } from 'vue'

export type PairAddressResult =
  | {
      kind: 'empty'
    }
  | {
      kind: 'exist'
      addr: Address
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
    ({ tokenA, tokenB }) => {
      const kaikas = kaikasStore.getKaikasAnyway()

      const { run, state } = useTask<PairAddressResult>(async () => {
        const addr = await kaikas.tokens.getPairAddress(tokenA, tokenB)
        const isEmpty = isEmptyAddress(addr)
        if (isEmpty) return { kind: 'empty' }

        const { pairBalance, userBalance } = await kaikas.tokens.getPairBalance(tokenA, tokenB)
        return {
          kind: 'exist',
          addr,
          totalSupply: pairBalance,
          userBalance,
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
