import { Address, Wei, WeiAsToken } from '@/core'
import { JSON_SERIALIZER } from '@/utils/json-serializer'
import { emptyPair, buildPair, mirrorTokenType, TokensPair, TokenType } from '@/utils/pair'
import { Serializer } from '@vueuse/core'
import BigNumber from 'bignumber.js'
import invariant from 'tiny-invariant'
import { Ref } from 'vue'

export function useLocalStorageAddrsOrigin(key: string, isActive?: Ref<boolean>) {
  const raw = useLocalStorage<TokensPair<Address | null>>(key + '-addrs', emptyPair(), {
    serializer: JSON_SERIALIZER as Serializer<any>,
  })

  const offable = computed({
    get: () => {
      if (isActive?.value ?? true) return raw.value
      return emptyPair()
    },
    set: (v) => {
      raw.value = v
    },
  })

  return offable
}

export function usePairInput(options?: { addrsOrigin?: Ref<TokensPair<Address | null>> }) {
  const tokensStore = useTokensStore()

  const addrsRaw = options?.addrsOrigin ?? ref<TokensPair<Address | null>>(emptyPair())
  const addrs = toReactive(addrsRaw)

  const tokenValuesRef = ref<TokensPair<null | WeiAsToken>>(emptyPair())
  const tokenValues = toReactive(tokenValuesRef)

  function setBothAddrs(value: TokensPair<Address | null>) {
    addrsRaw.value = value
  }

  function reset() {
    addrsRaw.value = emptyPair()
    resetInput()
  }

  function resetInput() {
    tokenValuesRef.value = emptyPair()
  }

  const tokensMeta = readonly(
    reactive(
      buildPair((type) =>
        computed(() => {
          const addr = addrs[type]
          return addr ? tokensStore.findTokenData(addr) ?? null : null
        }),
      ),
    ),
  )

  const weiFromTokens = readonly(
    buildPair((type) =>
      computed(() => {
        const token = tokenValues[type]
        if (!token) return null
        const meta = tokensMeta[type]
        if (!meta) return null
        const wei = Wei.fromToken(meta, token)
        return wei
      }),
    ),
    // `as` to avoid ugly types unwrapping
  ) as TokensPair<Wei | null>

  const completeWeiPair = computed<null | TokensPair<{ address: Address; wei: Wei }>>(() => {
    if (weiFromTokens.tokenA?.asBigInt && weiFromTokens.tokenB?.asBigInt) {
      return buildPair((type) => {
        const wei = weiFromTokens[type]!
        const address = addrs[type]
        invariant(address, 'Wei cannot be computed without address')
        return { address, wei }
      })
    }
    return null
  })

  const balance = readonly(
    buildPair((type) =>
      computed(() => {
        const addr = addrs[type]
        if (!addr) return null
        return tokensStore.lookupUserBalance(addr)
      }),
    ),
  )

  return {
    addrs,
    setBothAddrs,

    tokenValues,

    reset,
    resetInput,

    weiFromTokens,
    completeWeiPair,
    tokens: tokensMeta,
    balance,
  }
}

type PairInputReturn = ReturnType<typeof usePairInput>

type SetTokenFn = (type: TokenType, token: WeiAsToken) => void

interface EstimatedLayer {
  setMainToken: SetTokenFn
  setEstimated: (token: WeiAsToken) => void
  estimatedFor: Ref<null | TokenType>
  isEstimatedUpToDate: Ref<boolean>
}

export function useEstimatedLayer({ tokenValues }: Pick<PairInputReturn, 'tokenValues'>): EstimatedLayer {
  const estimatedFor = ref<null | TokenType>(null)
  const isUpToDate = ref(false)

  function setMainToken(type: TokenType, token: WeiAsToken) {
    if (new BigNumber(token).isZero()) {
      tokenValues.tokenA = tokenValues.tokenB = token
      estimatedFor.value = null
    } else {
      tokenValues[type] = token
      estimatedFor.value = mirrorTokenType(type)
    }
    isUpToDate.value = false
  }

  function setEstimated(token: WeiAsToken) {
    invariant(estimatedFor.value, 'Cannot set estimated value until main token is set')
    tokenValues[estimatedFor.value] = token
    isUpToDate.value = true
  }

  return {
    estimatedFor,
    isEstimatedUpToDate: isUpToDate,
    setMainToken,
    setEstimated,
  }
}
