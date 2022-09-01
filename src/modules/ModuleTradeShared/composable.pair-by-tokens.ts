import { Address, DexPure, isEmptyAddress, Wei } from '@/core'
import { TokensPair } from '@/utils/pair'
import { MaybeRef } from '@vueuse/core'
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

function dexAndTokensScopeParam(tokens: NullableReactiveTokens, anyDex: { key: string; dex: () => DexPure }) {
  const actualTokens = nullableReactiveTokensToComposedKey(tokens)
  return (
    actualTokens && {
      key: anyDex.key + actualTokens.key,
      payload: { dex: anyDex.dex(), tokens: actualTokens.payload },
    }
  )
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
  const dexStore = useDexStore()

  const scope = useParamScope(
    computed(() => dexAndTokensScopeParam(tokens, dexStore.anyDex)),
    ({ tokens, dex }) => {
      const { state, run } = useTask<Except<PairAddressResult, 'tokens'>>(
        async () => {
          const addr = await dex.tokens.getPairAddress(tokens)
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
      tokens: scope.value!.payload.tokens,
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
  const dexStore = useDexStore()

  const scope = useParamScope(
    computed(() => dexAndTokensScopeParam(tokens, dexStore.anyDex)),
    ({ tokens, dex }) => {
      const { state, run } = useTask(() => dex.tokens.getPairReserves(tokens), { immediate: true })
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
  totalSupply: Wei
  userBalance: Wei
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
  const dexStore = useDexStore()

  const scope = useParamScope(
    computed(() => {
      const { active } = dexStore
      const tokensKey = nullableReactiveTokensToComposedKey(tokens)

      return (
        unref(pairExists) &&
        tokensKey &&
        active.kind === 'named' && {
          key: `${active.wallet}-${tokensKey.key}`,
          payload: { dex: active.dex(), tokens: tokensKey.payload },
        }
      )
    }),
    ({ tokens, dex }) => {
      const { state, run } = useTask(
        async () => {
          const { totalSupply, userBalance } = await dex.tokens.getPairBalanceOfUser(tokens)
          const poolShare = userBalance.asBigNum.dividedBy(totalSupply.asBigNum).toNumber()

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
