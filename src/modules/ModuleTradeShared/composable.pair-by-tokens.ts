import { Address, Percent, Wei, isEmptyAddress } from '@/core'
import { ActiveDex, AnyDex } from '@/store/dex'
import { TokensPair } from '@/utils/pair'
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

function composeKeyWithAnyDex(tokens: NullableReactiveTokens, anyDex: AnyDex) {
  const actualTokens = nullableReactiveTokensToComposedKey(tokens)
  return (
    actualTokens && {
      key: anyDex.key + ' ' + actualTokens.key,
      payload: { dex: anyDex.dex(), tokens: actualTokens.payload },
    }
  )
}

function composeKeyWithNamedDexAndExistingPair(pairResult: null | PairAddressResult, dex: ActiveDex) {
  return (
    pairResult?.kind === 'exist' &&
    dex.kind === 'named' && {
      key: `${dex.wallet}-${pairResult.tokens.tokenA}-${pairResult.tokens.tokenB}`,
      payload: { dex: dex.dex(), pair: pairResult.addr, tokens: pairResult.tokens },
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
    () => composeKeyWithAnyDex(tokens, dexStore.anyDex),
    ({ payload: { tokens, dex } }) => {
      const { state, run } = useTask<PairAddressResult>(
        async () => {
          const addr = await dex.tokens.getPairAddress(tokens)
          if (isEmptyAddress(addr)) return { kind: 'empty', tokens }
          return { kind: 'exist', addr, tokens }
        },
        { immediate: true },
      )
      usePromiseLog(state, 'pair-addr')

      return { state, run }
    },
  )

  const state = computed(() => scope.value?.expose.state ?? null)

  const pending = computed(() => state.value?.pending ?? false)

  const pair = computed<null | PairAddressResult>(() => state.value?.fulfilled?.value ?? null)

  function touch() {
    scope.value?.expose.run()
  }

  return { pending, pair, touch }
}

export type PairAddressResultSimplified = PairAddressResult['kind']

export function useSimplifiedResult(result: Ref<null | PairAddressResult>): Ref<null | PairAddressResultSimplified> {
  return computed(() => result.value?.kind ?? null)
}

export function usePairReserves(pairResult: Ref<null | PairAddressResult>) {
  const dexStore = useDexStore()

  const scope = useParamScope(
    () => composeKeyWithNamedDexAndExistingPair(pairResult.value, dexStore.active),
    ({ payload: { tokens, dex } }) => {
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
}

export function usePairBalance(pairResult: Ref<null | PairAddressResult>): {
  pending: Ref<boolean>
  result: Ref<null | PairBalance>
  touch: () => void
} {
  const dexStore = useDexStore()

  const scope = useParamScope(
    () => composeKeyWithNamedDexAndExistingPair(pairResult.value, dexStore.active),
    ({ payload: { tokens, dex } }) => {
      const { state, run } = useTask(
        async () => {
          const { totalSupply, userBalance } = await dex.tokens.getPairBalanceOfUser(tokens)

          return {
            totalSupply,
            userBalance,
          }
        },
        { immediate: true },
      )
      usePromiseLog(state, 'pair-balance')

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
      const { totalSupply = null, userBalance = null } = balance.value ?? {}
      return { totalSupply, userBalance }
    }),
  )
}

/**
 * Estimated pool share is user's pool share after he will add (or remove)
 * some amount of liquidity.
 *
 * @param currentBalance current pair balance of user
 * @param addition how much amount user is willing to add
 */
export function computeEstimatedPoolShare(currentBalance: PairBalance, addition: Wei): Percent {
  return new Percent(
    currentBalance.userBalance.asBigInt + addition.asBigInt,
    currentBalance.totalSupply.asBigInt + addition.asBigInt,
  )
}
