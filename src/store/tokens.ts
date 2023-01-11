import { acceptHMRUpdate, defineStore } from 'pinia'
import { Address, Dex, DexPure, NATIVE_TOKEN, Token, Wei, isNativeToken } from '@/core'
import { WHITELIST_TOKENS } from '@/core'
import { Ref } from 'vue'
import { TokensQueryResult, useTokensQuery } from '@/query/tokens-derived-usd'
import BigNumber from 'bignumber.js'
import Debug from 'debug'
import { MinimalTokensApi } from '@/utils/minimal-tokens-api'

const debug = Debug('store-tokens')

export interface TokenWithOptionBalance extends Token {
  balance: null | Wei
}

function listItemsFromMapOrNull<K, V>(keys: K[], map: Map<K, V>): null | V[] {
  const fromMap: V[] = []

  for (const key of keys) {
    const value = map.get(key)
    if (!value) return null
    fromMap.push(value)
  }

  return fromMap
}

async function loadTokens(dex: DexPure, addrs: Address[]): Promise<Map<Address, Token>> {
  return new Map((await dex.tokens.getTokensBunch(addrs)).map((token) => [token.address, token]))
}

async function loadBalances(dex: Dex, tokens: Address[]): Promise<Map<Address, Wei>> {
  const { withoutKlay: tokensWithoutKlay, klay } = tokens.reduce(
    (acc, a) => {
      if (isNativeToken(a)) acc.klay = true
      else acc.withoutKlay.push(a)
      return acc
    },
    { withoutKlay: new Array<Address>(), klay: false },
  )

  const [balancesAll, balanceKlay] = await Promise.all([
    dex.tokens
      .getBalancesBunch(tokensWithoutKlay.map((a) => ({ address: a, balanceOf: dex.agent.address })))
      .then((balances) => {
        return balances.map<[Address, Wei]>((wei, i) => [tokensWithoutKlay[i], wei])
      }),
    klay ? dex.tokens.getKlayBalance().then((x) => [[NATIVE_TOKEN, x] as const]) : [],
  ])

  return new Map([...balanceKlay, ...balancesAll])
}

function useImportedTokens() {
  const dexStore = useDexStore()

  const tokens = useLocalStorage<Address[]>('klaytn-dex-imported-tokens', [])

  const scope = useParamScope(
    () => ({
      key: dexStore.anyDex.key,
      payload: dexStore.anyDex.dex(),
    }),
    ({ payload: dex }) => {
      const { state, run } = useTask(() => loadTokens(dex, tokens.value), { immediate: true })
      usePromiseLog(state, 'imported-tokens')
      useErrorRetry(state, run)
      return { state, run }
    },
  )

  const isPending = computed(() => scope.value.expose.state.pending)
  const result = computed(() => scope.value.expose.state.fulfilled?.value ?? null)
  const isLoaded = computed(() => !!result.value)

  const tokensFetched = computed<null | Token[]>(() => {
    if (!result.value) return null
    return listItemsFromMapOrNull(tokens.value, result.value)
  })

  function importToken(token: Token): void {
    tokens.value.unshift(token.address)
    scope.value.expose.run()
  }

  return {
    tokens: readonly(tokens),
    tokensFetched,
    isPending,
    isLoaded,
    importToken,
  }
}

function useUserBalance(tokens: Ref<null | Address[]>) {
  const dexStore = useDexStore()

  const fetchScope = useParamScope(
    () => !!tokens.value && dexStore.active.kind === 'named' && { key: 'active', payload: dexStore.active.dex() },
    ({ payload: dex }) => {
      const { state, run } = useTask<Map<Address, Wei>>(() => loadBalances(dex, tokens.value ?? []), {
        immediate: true,
      })

      usePromiseLog(state, 'user-balance')
      useErrorRetry(state, run)
      watch(tokens, run)

      return reactive({ ...toRefs(useStaleState(state)), touch: run })
    },
  )

  const isPending = computed<boolean>(() => fetchScope.value?.expose.pending ?? false)
  const result = computed<null | Map<Address, Wei>>(() => {
    const data = fetchScope.value?.expose.fulfilled?.value
    if (data) return new Map([...data].map(([addr, balance]) => [addr.toLowerCase() as Address, balance]))
    return null
  })
  const isLoaded = computed<boolean>(() => !!result.value)

  function touch() {
    fetchScope.value?.expose.touch()
  }

  function lookup(addr: Address): Wei | null {
    return result.value?.get(addr.toLowerCase() as Address) ?? null
  }

  return { isPending, isLoaded, lookup, touch }
}

function useDerivedUsdIndex(result: Ref<null | undefined | TokensQueryResult>): {
  lookup: (address: Address) => null | BigNumber
} {
  const map = computed<null | Map<string, BigNumber>>(() => {
    const items = result.value?.tokens ?? null
    const map = items && new Map(items.map((x) => [x.id.toLowerCase(), new BigNumber(x.derivedUSD)]))
    debug('computed derived usd map: %o', map, result.value)
    return map
  })

  return {
    lookup: (a) => map.value?.get(a.toLowerCase()) ?? null,
  }
}

function useTokensIndex(tokens: Ref<null | readonly Token[]>) {
  /**
   * All addresses are written in lower-case
   */
  type TokensIndexMap = Map<Address, Token>

  const tokensIndexMap = computed<null | TokensIndexMap>(() => {
    const list = tokens.value
    if (!list) return null
    return new Map(list.map((item) => [item.address.toLowerCase() as Address, item]))
  })

  /**
   * Lookup for token data by token's address. **Case insensitive**.
   */
  function findTokenData(addr: Address): null | Token {
    return tokensIndexMap.value?.get(addr.toLowerCase() as Address) ?? null
  }

  return { findTokenData }
}

/**
 * The general store for tokens and their information related to user.
 *
 * It has:
 *
 * - Imported and whitelist tokens; DEX token
 * - Tokens balances
 * - Tokens derived USD
 */
export const useTokensStore = defineStore('tokens', () => {
  const {
    tokens: importedAddresses,
    tokensFetched: importedFetched,
    isLoaded: isImportedLoaded,
    isPending: isImportedPending,
    importToken,
  } = useImportedTokens()

  /**
   * Does not depend on loading states
   */
  const allTokensAddresses = computed(() => [...importedAddresses.value, ...WHITELIST_TOKENS.map((x) => x.address)])

  const importedAndWhitelistTokens = computed(() =>
    importedFetched.value ? [...importedFetched.value, ...WHITELIST_TOKENS] : WHITELIST_TOKENS,
  )

  const allTokensInUse = importedAndWhitelistTokens

  const { findTokenData } = useTokensIndex(allTokensInUse)

  const {
    lookup: lookupUserBalance,
    isPending: isBalancePending,
    touch: touchUserBalance,
  } = useUserBalance(allTokensAddresses)

  const Query = useTokensQuery(allTokensAddresses, { pollInterval: 10_000 })

  whenever(
    () => !!importedFetched.value,
    () => Query.load(),
  )

  function touchDerivedUsd() {
    Query.refetch()
  }

  const isDerivedUSDPending = Query.loading

  const { lookup: lookupDerivedUsd } = useDerivedUsdIndex(Query.result)

  return {
    isBalancePending,
    isImportedPending,
    isImportedLoaded,
    isDerivedUSDPending,

    importedAddresses,
    importedAndWhitelistTokens,

    importToken,
    findTokenData,
    lookupUserBalance,
    touchUserBalance,
    lookupDerivedUsd,
    touchDerivedUsd,
  }
})

export function createMinimalTokenApiWithStores(): MinimalTokensApi {
  const tokens = useTokensStore()
  const dex = useDexStore()

  return {
    isSmartContract: (a) => dex.anyDex.dex().agent.isSmartContract(a),
    getToken: (a) => dex.anyDex.dex().tokens.getToken(a),
    lookupToken: (a) => tokens.findTokenData(a),
    lookupBalance: (a) => tokens.lookupUserBalance(a),
    lookupDerivedUsd: (a) => tokens.lookupDerivedUsd(a),
  }
}

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useTokensStore, import.meta.hot))
