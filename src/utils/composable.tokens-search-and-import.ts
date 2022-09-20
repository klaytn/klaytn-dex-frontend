import { Address, isAddress, Token } from '@/core'
import { Ref } from 'vue'
import escapeStringRegex from 'escape-string-regexp'

interface ComposableReturn<T extends Token> {
  tokensFiltered: Ref<T[]>
  isImportPending: Ref<boolean>
  importResult: Ref<null | ImportResult>
}

type ImportResult = { kind: 'not-found' } | { kind: 'found'; token: Token }

export function useTokensSearchAndImport<T extends Token>({
  tokens,
  search,
  isSmartContract,
  getToken,
  lookupToken,
}: {
  tokens: Ref<T[]>
  search: Ref<string>

  isSmartContract: (address: Address) => Promise<boolean>
  /**
   * Fetch token data from somewhere
   */
  getToken: (address: Address) => Promise<Token>
  /**
   * Reactive lookup for already stored token
   */
  lookupToken: (address: Address) => null | Token
}): ComposableReturn<T> {
  const searchAsAddress = computed<null | Address>(() => (isAddress(search.value) ? search.value : null))

  const notKnownAddress = computed<null | Address>(() => {
    const value = searchAsAddress.value
    if (value && lookupToken(value)) return null
    return value
  })

  const searchAsRegExp = computed(() => {
    const { value } = search
    return value ? new RegExp(escapeStringRegex(value), 'i') : null
  })

  const tokensFiltered = computed(() => {
    const reg = searchAsRegExp.value
    return reg
      ? tokens.value.filter((token) => reg.test(token.symbol) || reg.test(token.name) || reg.test(token.address))
      : tokens.value
  })

  const tryGetTokenScope = useParamScope(notKnownAddress, (tokenAddress) => {
    const { state } = useTask<ImportResult>(
      async () => {
        if (!(await isSmartContract(tokenAddress))) return { kind: 'not-found' }
        const token = await getToken(tokenAddress)
        return { kind: 'found', token }
      },
      { immediate: true },
    )

    const result = computed<null | ImportResult>(() => {
      if (state.fulfilled) return state.fulfilled.value
      if (state.rejected) return { kind: 'not-found' }
      return null
    })

    const pending = toRef(state, 'pending')

    return { result, pending }
  })

  const isImportPending = computed<boolean>(() => tryGetTokenScope.value?.expose.pending.value ?? false)
  const importResult = computed<null | ImportResult>(() => tryGetTokenScope.value?.expose.result.value ?? null)

  return {
    tokensFiltered,
    importResult,
    isImportPending,
  }
}
