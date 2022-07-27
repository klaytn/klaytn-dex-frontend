import { Address, tokenRawToWei, ValueWei } from '@/core/kaikas'
import { JSON_SERIALIZER } from '@/utils/common'
import { buildPair, mirrorTokenType, TokensPair, TokenType } from '@/utils/pair'
import { Serializer } from '@vueuse/core'
import invariant from 'tiny-invariant'
import { Ref } from 'vue'

function emptyAddrs(): TokensPair<Address | null> {
  return buildPair(() => null)
}

interface InputTypeValue {
  type: TokenType
  value: string
}

export interface InputWei {
  type: TokenType
  wei: ValueWei<string>
}

export function useExchangeRateInput(options?: {
  /**
   * If specified, input data will be synced with local storage
   */
  localStorageKey?: string
}) {
  const tokensStore = useTokensStore()

  const addrs = options?.localStorageKey
    ? useLocalStorage<TokensPair<Address | null>>(options.localStorageKey + '-addrs', emptyAddrs(), {
        serializer: JSON_SERIALIZER as Serializer<any>,
      })
    : ref<TokensPair<Address | null>>(emptyAddrs())
  const addrsReactive = toReactive(addrs)

  const input = ref<null | InputTypeValue>(null)
  const inputToken = computed(() => input.value?.type ?? null)

  function setAddrs(value: TokensPair<Address>) {
    addrs.value = value
  }

  function reset() {
    addrs.value = emptyAddrs()
    resetInput()
  }

  function resetInput() {
    input.value = null
  }

  const tokens = readonly(
    reactive(
      buildPair((type) =>
        computed(() => {
          const addr = addrsReactive[type]
          return addr ? tokensStore.findTokenData(addr) ?? null : null
        }),
      ),
    ),
  )

  const inputNormalized = computed<InputWei | null>(() => {
    const token = input.value
    if (!token) return null
    const tokenData = tokens[token.type]
    if (!tokenData) return null
    const wei = tokenRawToWei(tokenData, token.value)
    return { wei, type: token.type }
  })

  const balance = readonly(
    reactive(
      buildPair((type) =>
        computed(() => {
          const addr = addrsReactive[type]
          if (!addr) return null
          return tokensStore.lookupUserBalance(addr)
        }),
      ),
    ),
  )

  return {
    addrs: addrsReactive,
    setAddrs,
    reset,
    resetInput,
    input,
    inputToken,
    inputNormalized,
    tokens,
    balance,
  }
}

interface ExchangeRateInput {
  value: string
  type: 'active' | 'outdated' | 'estimated'
}

export function useInertExchangeRateInput({ input }: { input: Ref<null | InputTypeValue> }): {
  rates: TokensPair<ExchangeRateInput | null>
  exchangeRateFor: Ref<null | TokenType>
  set: (type: TokenType, value: string) => void
  /**
   * Implying this value is set for `exchangeRateFor`
   */
  setEstimated: (value: string) => void
} {
  const exchangeFor = computed(() => {
    const inputType = input.value?.type ?? null
    return inputType && mirrorTokenType(inputType)
  })

  const values = reactive<TokensPair<null | string>>(
    buildPair((type) => (type === input.value?.type ? input.value.value : null)),
  )

  const estimated = ref<boolean>(false)

  const rates = reactive(
    buildPair((type) =>
      computed<ExchangeRateInput | null>(() => {
        if (input.value?.type === type) {
          return { type: 'active', value: input.value.value }
        }
        const value = values[type]
        if (!type || !value) return null
        return {
          value,
          type: type === exchangeFor.value && estimated.value ? 'estimated' : 'outdated',
        }
      }),
    ),
  )

  function set(type: TokenType, value: string) {
    input.value = { type, value }
    values[type] = value
    estimated.value = false
  }

  function setEstimated(value: string) {
    invariant(exchangeFor.value)
    values[exchangeFor.value] = value
    estimated.value = true
  }

  return {
    rates,
    exchangeRateFor: exchangeFor,
    set,
    setEstimated,
  }
}
