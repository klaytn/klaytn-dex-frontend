import { Address, isEmptyAddress, ValueWei } from '@/core/kaikas'
import { TokensPair } from '@/utils/pair'
import BigNumber from 'bignumber.js'
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
      poolShare: number
    }

export function usePairAddress(tokens: TokensPair<Address | null | undefined>): {
  pending: Ref<boolean>
  pair: Ref<null | PairAddressResult>
  touch: () => void
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

      const { state, run } = useTask<PairAddressResult>(
        async () => {
          const addr = await kaikas.tokens.getPairAddress(actualTokens)
          const isEmpty = isEmptyAddress(addr)
          if (isEmpty) return { kind: 'empty', tokens: actualTokens }

          const { totalSupply, userBalance } = await kaikas.tokens.getPairBalanceOfUser(actualTokens)

          const poolShare = new BigNumber(userBalance).dividedBy(totalSupply).toNumber()

          return {
            kind: 'exist',
            addr,
            totalSupply,
            userBalance,
            tokens: actualTokens,
            poolShare,
          }
        },
        { immediate: true },
      )
      usePromiseLog(state, 'pair-addr')

      return { state, run }
    },
  )

  const pending = computed(() => scope.value?.expose.state.pending ?? false)
  const pair = computed(() => scope.value?.expose.state.fulfilled?.value ?? null)

  function touch() {
    scope.value?.expose.run()
  }

  return { pending, pair, touch }
}

export type PairAddressResultSimplified = PairAddressResult['kind']

export function useSimplifiedResult(result: Ref<null | PairAddressResult>): Ref<null | PairAddressResultSimplified> {
  return computed(() => result.value?.kind ?? null)
}

export function usePairReserves(tokens: TokensPair<Address | null> | Ref<null | TokensPair<null | Address>>) {
  const kaikasStore = useKaikasStore()

  const scope = useScopeWithAdvancedKey(
    computed(() => {
      const { tokenA, tokenB } = unref(tokens) ?? {}
      if (!tokenA || !tokenB) return null
      return {
        key: `${tokenA}-${tokenB}`,
        payload: { tokenA, tokenB },
      }
    }),
    (tokens) => {
      const { state } = useTask(() => kaikasStore.getKaikasAnyway().tokens.getPairReserves(tokens), { immediate: true })
      usePromiseLog(state, 'pair-reserves')
      return flattenState(state)
    },
  )

  const pending = computed(() => scope.value?.expose.pending ?? false)
  const result = computed(() => scope.value?.expose.fulfilled ?? null)

  return { pending, result }
}
