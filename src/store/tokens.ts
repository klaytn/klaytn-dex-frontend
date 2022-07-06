import { acceptHMRUpdate, defineStore } from 'pinia'
import { Address, Balance, Token, ValueWei } from '@/core/kaikas'
import { useTask } from '@vue-kakuyaku/core'
import { WHITELIST_TOKENS } from '@/core/kaikas/const'
import invariant from 'tiny-invariant'

export interface TokenWithOptionBalance extends Token {
  balance: null | ValueWei<string>
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
  const importedTokensMap = ref(new Map<Address, Token>())

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

    importedTokensMap.value = new Map(pairs)
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

  function tryFindToken(addr: Address): null | Token {
    return tokens.value?.find((x) => x.address === addr) ?? null
  }

  const getUserBalanceTask = useTask<Map<Address, Balance>>(async () => {
    const kaikas = kaikasStore.getKaikasAnyway()
    invariant(tokens.value)

    const entries = await Promise.all(
      tokens.value.map(async ({ address }) => {
        const balance = await kaikas.getTokenBalance(address)
        return [address, balance] as [Address, Balance]
      }),
    )

    return new Map(entries)
  })
  useTaskLog(getUserBalanceTask, 'user-balance')
  const userBalanceMap = computed(() => {
    const state = getUserBalanceTask.state
    return state.kind === 'ok' ? state.data : null
  })

  function getUserBalance() {
    getUserBalanceTask.run()
  }

  const tokensWithBalance = computed<null | TokenWithOptionBalance[]>(() => {
    const balanceMap = userBalanceMap.value
    return (
      tokens.value?.map<TokenWithOptionBalance>((x) => ({
        ...x,
        balance: balanceMap?.get(x.address) ?? null,
      })) ?? null
    )
  })

  return {
    tokens,
    tryFindToken,

    getWhitelistAndImportedTokens: getImportedTokens,
    importToken,

    getUserBalance,
    userBalanceMap,
    tokensWithBalance,
  }
})

import.meta.hot?.accept(acceptHMRUpdate(useTokensStore, import.meta.hot))
