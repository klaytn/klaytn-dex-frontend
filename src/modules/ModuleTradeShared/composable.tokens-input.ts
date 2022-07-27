import { Address, Wei, WeiAsToken } from '@/core/kaikas'
import { buildPair, TokensPair, TokenType } from '@/utils/pair'
import { TokenAddrAndWeiInput } from '../ModuleSwap/util.swap-props'

export interface TokenInput {
  addr: Address | null
  inputRaw: WeiAsToken
}

function emptyInput(addrs?: TokensPair<Address>): TokensPair<TokenInput> {
  return buildPair((type) => ({
    addr: addrs?.[type] ?? null,
    inputRaw: '' as WeiAsToken,
  }))
}

export function useTokensInput(options?: {
  /**
   * If specified, input data will be synced with local storage
   */
  localStorageKey?: string
}) {
  const tokensStore = useTokensStore()

  const input = options?.localStorageKey
    ? useLocalStorage<TokensPair<TokenInput>>(options.localStorageKey, emptyInput(), {
        serializer: {
          read: (raw) => JSON.parse(raw),
          write: (parsed) => JSON.stringify(parsed),
        },
      })
    : ref<TokensPair<TokenInput>>(emptyInput())
  const inputObj = toReactive(input)

  const resetInput = (addrs: TokensPair<Address>) => {
    input.value = emptyInput(addrs)
  }

  const addrsWritable = reactive(
    buildPair((type) =>
      computed({
        get: () => inputObj[type].addr,
        set: (v) => {
          inputObj[type].addr = v
        },
      }),
    ),
  )

  const tokens = readonly(
    reactive(
      buildPair((type) =>
        computed(() => {
          const addr = inputObj[type]?.addr
          return addr ? tokensStore.findTokenData(addr) ?? null : null
        }),
      ),
    ),
  )

  const wei = readonly(
    reactive(
      buildPair((type) =>
        computed(() => {
          const raw = inputObj[type]?.inputRaw
          if (!raw) return null
          const token = tokens[type]
          if (!token) return null
          return { addr: token.address, input: Wei.fromToken(token, raw) }
        }),
      ),
    ),
  ) as TokensPair<TokenAddrAndWeiInput>

  const balance = readonly(
    reactive(
      buildPair((type) =>
        computed(() => {
          const addr = inputObj[type]?.addr
          if (!addr) return null
          return tokensStore.lookupUserBalance(addr)
        }),
      ),
    ),
  ) as TokensPair<Wei>

  return {
    input: inputObj,
    resetInput,

    addrsWritable,
    tokens,
    wei,
    balance,
  }
}
