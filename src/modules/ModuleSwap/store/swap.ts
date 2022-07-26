import { acceptHMRUpdate, defineStore } from 'pinia'
import invariant from 'tiny-invariant'
import { Address, asWei, tokenWeiToRaw, ValueWei } from '@/core/kaikas'
import BigNumber from 'bignumber.js'
import { TokenType, TokensPair, mirrorTokenType, buildPair } from '@/utils/pair'
import Debug from 'debug'
import { useGetAmount, GetAmountProps } from '../composable.get-amount'
import { usePairAddress, usePairBalance, useSimplifiedResult } from '../../ModuleTradeShared/composable.pair-by-tokens'
import { useSwapValidation } from '../composable.validation'
import { buildSwapProps, TokenAddrAndWeiInput } from '../util.swap-props'
import { useExchangeRateInput, useInertExchangeRateInput } from '../../ModuleTradeShared/composable.exchange-rate-input'
import { Ref } from 'vue'
import { useRates } from '@/modules/ModuleTradeShared/composable.rates'
import BN from 'bn.js'

const debugModule = Debug('swap-store')

type NormalizedWeiInput = TokensPair<TokenAddrAndWeiInput> & { amountFor: TokenType }

function useNormalizedWeiInputs({
  addrs,
  inputNormalized,
  gotAmount,
}: {
  addrs: TokensPair<null | Address>
  inputNormalized: Ref<null | { wei: ValueWei<string>; type: TokenType }>
  gotAmount: Ref<null | { type: TokenType; amount: ValueWei<string> }>
}): Ref<null | NormalizedWeiInput> {
  return computed(() => {
    if (
      addrs.tokenA &&
      addrs.tokenB &&
      inputNormalized.value &&
      gotAmount.value &&
      inputNormalized.value.type === mirrorTokenType(gotAmount.value.type)
    ) {
      const inputType = inputNormalized.value.type
      const amountForType = mirrorTokenType(inputType)

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const tokens = {
        [inputType]: { addr: addrs[inputType], input: inputNormalized.value.wei },
        [amountForType]: { addr: addrs[amountForType], input: gotAmount.value.amount },
      } as TokensPair<TokenAddrAndWeiInput>

      return {
        ...tokens,
        amountFor: amountForType,
      }
    }
    return null
  })
}

function useSwap(input: Ref<null | NormalizedWeiInput>) {
  const kaikasStore = useKaikasStore()
  const tokensStore = useTokensStore()

  const [active, setActive] = useToggle(false)

  const swapKey = computed(() => {
    if (!input.value) return null
    const { tokenA, tokenB, amountFor } = input.value
    return {
      key: `${tokenA.addr}-${tokenA.input}-${tokenB.addr}-${tokenB.input}-${amountFor}`,
      payload: { tokenA, tokenB, amountFor },
    }
  })
  watch(swapKey, () => setActive(false))

  const scope = useParamScope(
    computed(() => active.value && swapKey.value),
    ({ tokenA, tokenB, amountFor }) => {
      const { state: prepareState, run: prepare } = useTask(
        async () => {
          const kaikas = kaikasStore.getKaikasAnyway()

          // 1. Approve amount of the tokenA
          await kaikas.cfg.approveAmount(tokenA.addr, tokenA.input)

          // 2. Perform swap according to which token is "exact" and if
          // some of them is native
          const swapProps = buildSwapProps({ tokenA, tokenB, referenceToken: mirrorTokenType(amountFor) })
          const { send, gas } = await kaikas.swap.swap(swapProps)

          return { send, gas }
        },
        { immediate: true },
      )

      usePromiseLog(prepareState, 'prepare-swap')

      const { state: swapState, run: swap } = useTask(async () => {
        invariant(prepareState.fulfilled)
        const { send } = prepareState.fulfilled.value
        await send()
      })

      usePromiseLog(swapState, 'swap')
      wheneverFulfilled(swapState, () => {
        tokensStore.touchUserBalance()
      })
      useNotifyOnError(swapState, 'Swap failed')

      return {
        prepare,
        swap,
        gas: computed(() => prepareState.fulfilled?.value.gas ?? null),
        prepareState: promiseStateToFlags(prepareState),
        swapState: promiseStateToFlags(swapState),
      }
    },
  )

  return {
    prepare: () => {
      scope.value ? scope.value.expose.prepare() : setActive(true)
    },
    clear: () => setActive(false),
    swapGas: computed(() => scope.value?.expose.gas ?? null),
    prepareState: computed(() => scope.value?.expose.prepareState ?? null),
    swapState: computed(() => scope.value?.expose.swapState ?? null),
    swap: () => scope.value?.expose.swap(),
  }
}

export const useSwapStore = defineStore('swap', () => {
  const selection = useExchangeRateInput({ localStorageKey: 'swap-selection' })
  const selectionInput = useInertExchangeRateInput({ input: selection.input })
  const { rates: inputRates } = selectionInput
  const { tokens } = selection
  const addrsReadonly = readonly(selection.addrs)

  const symbols = computed(() => buildPair((type) => tokens[type]?.symbol ?? null))

  const { pair: pairAddrResult } = usePairAddress(addrsReadonly)
  const { result: pairBalance } = usePairBalance(
    addrsReadonly,
    computed(() => pairAddrResult.value?.kind === 'exist'),
  )
  const poolShare = computed(() => pairBalance.value?.poolShare ?? null)
  const formattedPoolShare = useFormattedPercent(poolShare, 7)

  const { gotAmountFor, gettingAmountFor } = useGetAmount(
    computed<GetAmountProps | null>(() => {
      const amountFor = selectionInput.exchangeRateFor.value
      if (!amountFor) return null

      const referenceValue = selection.inputNormalized.value?.wei
      if (!referenceValue || new BigNumber(referenceValue).isLessThanOrEqualTo(0)) return null

      const { tokenA, tokenB } = addrsReadonly
      if (!tokenA || !tokenB) return null

      if (pairAddrResult.value?.kind !== 'exist') return null

      return {
        tokenA,
        tokenB,
        amountFor,
        referenceValue: referenceValue,
      }
    }),
  )
  // const
  watch(
    [gotAmountFor, selection.tokens],
    ([result]) => {
      if (result) {
        const { type: amountFor, amount } = result
        const tokenData = selection.tokens[amountFor]
        if (tokenData) {
          debugModule('Setting computed amount %o for %o', amount, amountFor)
          const raw = tokenWeiToRaw(tokenData, amount)
          selectionInput.setEstimated(new BigNumber(raw).toFixed(5))
        }
      }
    },
    { deep: true },
  )

  const normalizedWeiInputs = useNormalizedWeiInputs({
    addrs: addrsReadonly,
    inputNormalized: selection.inputNormalized,
    gotAmount: gotAmountFor,
  })
  const rates = useRates(
    computed(() => {
      const wei = normalizedWeiInputs.value
      if (!wei) return null
      return buildPair((type) => asWei(new BN(wei[type].input)))
    }),
  )

  const swapValidation = useSwapValidation({
    tokenA: computed(() => {
      const balance = selection.balance.tokenA as ValueWei<BigNumber> | null
      const token = selection.tokens.tokenA
      const input = normalizedWeiInputs.value?.tokenA?.input

      return balance && token && input ? { ...token, balance, input } : null
    }),
    tokenB: computed(() => selection.tokens.tokenB),
    pairAddr: useSimplifiedResult(pairAddrResult),
  })

  const isValid = computed(() => swapValidation.value.kind === 'ok')
  const validationMessage = computed(() => (swapValidation.value.kind === 'err' ? swapValidation.value.message : null))

  const { prepare, prepareState, swapState, swapGas, swap, clear: clearSwap } = useSwap(normalizedWeiInputs)

  function setToken(type: TokenType, addr: Address | null) {
    selection.addrs[type] = addr
  }

  function setBothTokens(pair: TokensPair<Address>) {
    selection.setAddrs(pair)
    selection.input.value = null
  }

  function setTokenValue(type: TokenType, value: string) {
    selectionInput.set(type, value)
  }

  function reset() {
    selection.reset()
  }

  return {
    inputRates,
    rates,
    addrs: addrsReadonly,
    normalizedWeiInputs,
    tokens,
    symbols,
    formattedPoolShare,

    isValid,
    validationMessage,

    swap,
    swapState,
    prepareState,
    prepare,
    swapGas,
    gettingAmountFor,
    gotAmountFor,
    clearSwap,

    setToken,
    setTokenValue,
    setBothTokens,
    reset,
  }
})

import.meta.hot?.accept(acceptHMRUpdate(useSwapStore, import.meta.hot))
