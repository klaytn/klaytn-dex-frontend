import { Address, tokenRawToWei } from '@/core/kaikas'
import { buildPair, doForPair, TokensPair } from '@/utils/pair'

export interface TokenInput {
  addr: Address | null
  inputRaw: string
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

  const addrsWritable = reactive(
    buildPair((type) =>
      computed({
        get: () => input[type].addr,
        set: (v) => {
          input[type].addr = v
        },
      }),
    ),
  )

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
        computed(() => {
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
          return tokensStore.lookupUserBalance(addr)
        }),
      ),
    ),
  )

  return {
    input,
    resetInput,

    addrsWritable,
    tokens,
    wei,
    balance,
  }
}
