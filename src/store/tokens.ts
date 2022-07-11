import { acceptHMRUpdate, defineStore } from 'pinia'
import { Address, asWei, Balance, Token } from '@/core/kaikas'
import { useStaleIfErrorState, useTask } from '@vue-kakuyaku/core'
import { WHITELIST_TOKENS } from '@/core/kaikas/const'
import invariant from 'tiny-invariant'
import BigNumber from 'bignumber.js'

export interface TokenWithOptionBalance extends Token {
  balance: null | Balance<BigNumber>
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

export const useTokensStore = defineStore('tokens', () => {
  const kaikasStore = useKaikasStore()

  const importedTokensAddrs = useLocalStorage<Address[]>('klaytn-dex-imported-tokens', [])

  const importedTokensOrdered = computed<null | Token[]>(() => {
    return listItemsFromMapOrNull(importedTokensAddrs.value, importedTokensMap.value)
  })

  const getImportedTokensTask = useTask(async () => {
    const kaikas = kaikasStore.getKaikasAnyway()

    const pairs = await Promise.all(
      importedTokensAddrs.value.map(async (addr) => {
        const token = await kaikas.getToken(addr)
        return [addr, token] as [Address, Token]
      }),
    )

    return new Map(pairs)
  })

  const getImportedTokensTaskState = useStaleIfErrorState(getImportedTokensTask)
  const areImportedTokensLoaded = computed(() => getImportedTokensTask.state.kind === 'ok')
  const importedTokensMap = computed<Map<Address, Token>>(() => {
    return getImportedTokensTaskState.result?.some ?? new Map()
  })

  /**
   * Saves new imported token
   */
  function importToken(token: Token): void {
    importedTokensAddrs.value.unshift(token.address)
    importedTokensMap.value.set(token.address, token)
  }

  useTaskLog(getImportedTokensTask, 'imported-tokens')

  function getImportedTokens() {
    getImportedTokensTask.run()
  }

  const tokens = computed<null | Token[]>(() => {
    const imported = importedTokensOrdered.value
    if (!imported) return null

    return [...imported, ...WHITELIST_TOKENS]
  })

  // TODO find in map, not in a list
  function tryFindToken(addr: Address): null | Token {
    return tokens.value?.find((x) => x.address === addr) ?? null
  }

  const getUserBalanceTask = useTask<Map<Address, Balance<string>>>(async () => {
    const kaikas = kaikasStore.getKaikasAnyway()
    invariant(tokens.value)

    const entries = await Promise.all(
      tokens.value.map(async ({ address }) => {
        const balance = await kaikas.getTokenBalance(address)
        return [address, balance] as [Address, Balance<string>]
      }),
    )

    return new Map(entries)
  })
  useTaskLog(getUserBalanceTask, 'user-balance')
  const userBalanceTaskState = useStaleIfErrorState(getUserBalanceTask)
  const userBalanceMap = computed<null | Map<Address, Balance<BigNumber>>>(() => {
    const data = userBalanceTaskState.result?.some
    if (data) return new Map([...data].map(([addr, balance]) => [addr, asWei(new BigNumber(balance))]))
    return null
  })

  function getUserBalance() {
    getUserBalanceTask.run()
  }

  const tokensWithBalance = computed<null | TokenWithOptionBalance[]>(() => {
    const balanceMap = userBalanceMap.value
    return (
      tokens.value?.map<TokenWithOptionBalance>((x) => {
        return {
          ...x,
          balance: balanceMap?.get(x.address) ?? null,
        }
      }) ?? null
    )
  })

  const isDataLoading = computed(() => userBalanceTaskState.pending || getImportedTokensTaskState.pending)
  const doesDataExist = computed(() => areImportedTokensLoaded.value && userBalanceMap.value)

  return {
    tokens,
    tryFindToken,

    isDataLoading,
    getImportedTokens,
    areImportedTokensLoaded,
    getUserBalance,
    userBalanceMap,
    tokensWithBalance,
    doesDataExist,

    importToken,
  }
})

import.meta.hot?.accept(acceptHMRUpdate(useTokensStore, import.meta.hot))
