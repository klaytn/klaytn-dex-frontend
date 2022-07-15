import { Address, tokenRawToWei, ValueWei } from '@/core/kaikas'
import { buildPair, doForPair, TokensPair } from '@/utils/pair'

export interface TokenInput {
  addr: Address | null
  inputRaw: string
}

export interface TokenInputWei {
  addr: Address
  input: ValueWei<string>
}

export function useTokensInput() {
  const tokensStore = useTokensStore()

  const input = reactive<TokensPair<TokenInput>>(
    buildPair(() => ({
      addr: null,
      inputRaw: '',
    })),
  )
  const resetInput = (newData: TokensPair<TokenInput>) => {
    Object.assign(input, newData)
  }

  const addrs = readonly(buildPair((type) => computed(() => input[type]?.addr)))

  const tokens = readonly(
    reactive(
      buildPair((type) =>
        computed(() => {
          const addr = input[type]?.addr
          return addr ? tokensStore.findTokenData(addr) ?? null : null
        }),
      ),
    ),
  )

  const wei = readonly(
    reactive(
      buildPair((type) =>
        computed<TokenInputWei | null>(() => {
          const raw = input[type]?.inputRaw
          if (!raw) return null
          const token = tokens[type]
          if (!token) return null
          return { addr: token.address, input: tokenRawToWei(token, raw) }
        }),
      ),
    ),
  )

  const balance = readonly(
    reactive(
      buildPair((type) =>
        computed(() => {
          const addr = input[type]?.addr
          if (!addr) return null
          return tokensStore.userBalanceMap?.get(addr) ?? null
        }),
      ),
    ),
  )

  return {
    input,
    resetInput,

    addrs,
    tokens,
    wei,
    balance,
  }
}

export function syncInputAddrsWithLocalStorage(selection: TokensPair<TokenInput>, key: string) {
  doForPair((type) => {
    const ls = useLocalStorage<null | Address>(`${key}-${type}`, null)
    const selectionWritable = computed({
      get: () => selection[type].addr,
      set: (v) => {
        selection[type].addr = v
      },
    })
    if (ls.value && !selectionWritable.value) {
      selectionWritable.value = ls.value
    }
    syncRef(selectionWritable, ls)
  })
}
