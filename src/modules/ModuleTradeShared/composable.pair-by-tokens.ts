import { Address, isEmptyAddress, Wei } from '@/core/kaikas'
import { TokensPair } from '@/utils/pair'
import { MaybeRef } from '@vueuse/core'
import BigNumber from 'bignumber.js'
import { Except } from 'type-fest'
import { Ref } from 'vue'

type NullableReactiveTokens = TokensPair<Address | null> | Ref<null | TokensPair<null | Address>>

function nullableReactiveTokensToComposedKey(tokens: NullableReactiveTokens) {
  const { tokenA, tokenB } = unref(tokens) ?? {}
  if (!tokenA || !tokenB) return null
  return {
    key: `${tokenA}-${tokenB}`,
    payload: { tokenA, tokenB },
  }
}

export type PairAddressResult =
  | {
      kind: 'empty'
      tokens: TokensPair<Address>
    }
  | {
      kind: 'exist'
      addr: Address
      tokens: TokensPair<Address>
    }

export function usePairAddress(tokens: NullableReactiveTokens): {
  pending: Ref<boolean>
  pair: Ref<null | PairAddressResult>
  touch: () => void
} {
  const kaikasStore = useKaikasStore()

  const scope = useParamScope(
    computed(() => kaikasStore.isConnected && nullableReactiveTokensToComposedKey(tokens)),
    (actualTokens) => {
      const kaikas = kaikasStore.getKaikasAnyway()

      const { state, run } = useTask<Except<PairAddressResult, 'tokens'>>(
        async () => {
          const addr = await kaikas.tokens.getPairAddress(actualTokens)
          if (isEmptyAddress(addr)) return { kind: 'empty' }
          return { kind: 'exist', addr }
        },
        { immediate: true },
      )
      usePromiseLog(state, 'pair-addr')

      return { state, run }
    },
  )

  const pending = computed(() => scope.value?.expose.state.pending ?? false)
  const pair = computed<null | PairAddressResult>(() => {
    const result = scope.value?.expose.state.fulfilled?.value
    if (!result) return null
    return {
      ...result,
      tokens: scope.value!.payload,
    }
  })

  function touch() {
    scope.value?.expose.run()
  }

  return { pending, pair, touch }
}

export type PairAddressResultSimplified = PairAddressResult['kind']

export function useSimplifiedResult(result: Ref<null | PairAddressResult>): Ref<null | PairAddressResultSimplified> {
  return computed(() => result.value?.kind ?? null)
}

export function usePairReserves(tokens: NullableReactiveTokens) {
  const kaikasStore = useKaikasStore()

  const scope = useParamScope(
    computed(() => kaikasStore.isConnected && nullableReactiveTokensToComposedKey(tokens)),
    (actualTokens) => {
      const { state, run } = useTask(() => kaikasStore.getKaikasAnyway().tokens.getPairReserves(actualTokens), {
        immediate: true,
      })
      usePromiseLog(state, 'pair-reserves')
      return { state: flattenState(state), run }
    },
  )

  const pending = computed(() => scope.value?.expose.state.pending ?? false)
  const result = computed(() => scope.value?.expose.state.fulfilled ?? null)
  const touch = () => scope.value?.expose.run()

  return { pending, result, touch }
}

interface PairBalance {
  totalSupply: ValueWei<string>
  userBalance: ValueWei<string>
  poolShare: number
}

export function usePairBalance(
  tokens: NullableReactiveTokens,
  pairExists: MaybeRef<boolean>,
): {
  pending: Ref<boolean>
  result: Ref<null | PairBalance>
  touch: () => void
} {
  const kaikasStore = useKaikasStore()

  const scope = useParamScope(
    computed(() => (kaikasStore.isConnected && unref(pairExists) ? nullableReactiveTokensToComposedKey(tokens) : null)),
    (actualTokens) => {
      const { state, run } = useTask(
        async () => {
          const kaikas = kaikasStore.getKaikasAnyway()
          const { totalSupply, userBalance } = await kaikas.tokens.getPairBalanceOfUser(actualTokens)
          const poolShare = new BigNumber(userBalance).dividedBy(totalSupply).toNumber()

          return {
            totalSupply,
            userBalance,
            poolShare,
          }
        },
        { immediate: true },
      )

      return { state, run }
    },
  )

  const pending = computed(() => scope.value?.expose.state.pending ?? false)
  const result = computed(() => scope.value?.expose.state.fulfilled?.value ?? null)
  const touch = () => scope.value?.expose.run()

  return { pending, result, touch }
}

export function useNullablePairBalanceComponents(balance: Ref<null | PairBalance>): {
  [K in keyof PairBalance]: null | PairBalance[K]
} {
  return toReactive(
    computed(() => {
      const { totalSupply = null, userBalance = null, poolShare = null } = balance.value ?? {}
      return { totalSupply, userBalance, poolShare }
    }),
  )
}
