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

      const { state } = useTask<PairAddressResult>(
        async () => {
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
        },
        { immediate: true },
      )
      usePromiseLog(state, 'pair-addr')

      return state
    },
  )

  const pending = computed(() => scope.value?.expose.pending ?? false)
  const pair = computed(() => scope.value?.expose.fulfilled?.value ?? null)

  return { pending, pair }
}

export type PairAddressResultSimplified = PairAddressResult['kind']

export function useSimplifiedResult(result: Ref<null | PairAddressResult>): Ref<null | PairAddressResultSimplified> {
  return computed(() => result.value?.kind ?? null)
}

export function usePairReserves(tokens: TokensPair<Address | null> | Ref<null | TokensPair<null | Address>>) {
  const kaikasStore = useKaikasStore()

  const normalized = computed(() => {
    const { tokenA, tokenB } = unref(tokens) ?? {}
    if (!tokenA || !tokenB) return null
    return { tokenA, tokenB }
  })

  const scope = useScope(
    computed(() => !!normalized.value && kaikasStore.isConnected),
    () => {
      const { tokenA, tokenB } = normalized.value!

      const task = useTask(async () => {
        return kaikasStore.getKaikasAnyway().tokens.getPairReserves({ tokenA, tokenB })
      })

      useTaskLog(task, 'pair-reserves')
      task.run()

      return task
    },
  )

  const reserves = computed(() => {
    const state = scope.value?.setup.state
    if (!state) return null
    return state.kind === 'ok' ? state.data : null
  })

  return reserves
}
