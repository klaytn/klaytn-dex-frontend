import { acceptHMRUpdate, defineStore } from 'pinia'
import { Status } from '@soramitsu-ui/ui'
import invariant from 'tiny-invariant'
import { useTask, useStaleIfErrorState, wheneverTaskErrors, wheneverTaskSucceeds } from '@vue-kakuyaku/core'
import { Address, tokenRawToWei, tokenWeiToRaw } from '@/core/kaikas'
import BigNumber from 'bignumber.js'
import { TokenType, TokensPair, buildPair, mirrorTokenType, doForPair } from '@/utils/pair'
import Debug from 'debug'
import { InputRaw } from '../types'
import { useGetAmount, GetAmountProps } from '../composable.get-amount'
import { usePairAddress, PairAddressResult } from '../composable.pair-addr'
import { useSwapValidation } from '../composable.validation'
import { buildSwapProps } from '../util.swap-props'

const debugRoot = Debug('swap-store')

function syncSelectionAddrsWithLocalStorage(selection: TokensPair<InputRaw>) {
  doForPair((type) => {
    const ls = useLocalStorage<null | Address>(`swap-store-selection-${type}`, null)
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

export const useSwapStore = defineStore('swap', () => {
  const kaikasStore = useKaikasStore()
  const tokensStore = useTokensStore()

  const selection = reactive<TokensPair<InputRaw>>(
    buildPair(() => ({
      addr: null,
      inputRaw: '',
    })),
  )
  syncSelectionAddrsWithLocalStorage(selection)
  const resetSelection = (newData: TokensPair<InputRaw>) => {
    Object.assign(selection, newData)
  }

  const selectionAddrs = reactive(buildPair((type) => computed(() => selection[type]?.addr)))

  const selectionTokens = reactive(
    buildPair((type) =>
      computed(() => {
        const addr = selection[type]?.addr
        return addr ? tokensStore.findTokenData(addr) ?? null : null
      }),
    ),
  )

  const selectionWeis = reactive(
    buildPair((type) =>
      computed(() => {
        const raw = selection[type]?.inputRaw
        if (!raw) return null
        const token = selectionTokens[type]
        if (!token) return null
        return { addr: token.address, input: tokenRawToWei(token, raw) }
      }),
    ),
  )

  const pairAddress = usePairAddress(selectionAddrs)
  const pairAddrResult = computed<PairAddressResult>(() => {
    const state = pairAddress.value?.state
    if (state?.kind === 'ok') {
      return state.data.isEmpty ? 'empty' : 'not-empty'
    }
    return 'unknown'
  })

  const selectionBalance = reactive(
    buildPair((type) =>
      computed(() => {
        const addr = selection[type]?.addr
        if (!addr) return null
        return tokensStore.userBalanceMap?.get(addr) ?? null
      }),
    ),
  )

  const swapValidation = useSwapValidation({
    tokenA: computed(() => {
      const balance = selectionBalance.tokenA
      const token = selectionTokens.tokenA
      const input = selectionWeis.tokenA?.input

      return balance && token && input ? { ...token, balance, input } : null
    }),
    tokenB: computed(() => selectionTokens.tokenB),
    pairAddr: pairAddrResult,
  })

  const isValid = computed(() => swapValidation.value.kind === 'ok')
  const validationMessage = computed(() => (swapValidation.value.kind === 'err' ? swapValidation.value.message : null))

  const getAmountFor = ref<null | TokenType>(null)

  const {
    gotAmountFor,
    gettingAmountFor,
    trigger: triggerGetAmount,
  } = useGetAmount(
    computed<GetAmountProps | null>(() => {
      const amountFor = getAmountFor.value
      if (!amountFor) return null

      const referenceValue = selectionWeis[mirrorTokenType(amountFor)]
      if (!referenceValue || new BigNumber(referenceValue.input).isLessThanOrEqualTo(0)) return null

      const { tokenA, tokenB } = selectionAddrs
      if (!tokenA || !tokenB) return null

      if (pairAddrResult.value !== 'not-empty') return null

      return {
        tokenA,
        tokenB,
        amountFor,
        referenceValue: referenceValue.input,
      }
    }),
  )
  // const
  watch(
    [gotAmountFor, selectionTokens],
    ([result]) => {
      if (result) {
        const { type: amountFor, amount } = result
        const tokenData = selectionTokens[amountFor]
        if (tokenData) {
          debugRoot('Setting computed amount %o for %o', amount, amountFor)
          const raw = tokenWeiToRaw(tokenData, amount)
          selection[amountFor].inputRaw = new BigNumber(raw).toFixed(5)
        }
      }
    },
    { deep: true },
  )

  function getSwapPrerequisitesAnyway() {
    const { tokenA, tokenB } = selectionWeis
    invariant(tokenA && tokenB, 'Both tokens should be selected')

    const amountFor = getAmountFor.value
    invariant(amountFor, '"Amount for" should be set')

    return { tokenA, tokenB, amountFor }
  }

  const swapTask = useTask(async () => {
    const kaikas = kaikasStore.getKaikasAnyway()
    const { tokenA, tokenB, amountFor } = getSwapPrerequisitesAnyway()

    // 1. Approve amount of the tokenA
    await kaikas.cfg.approveAmount(tokenA.addr, tokenA.input)

    // 2. Perform swap according to which token is "exact" and if
    // some of them is native
    const swapProps = buildSwapProps({ tokenA, tokenB, referenceToken: mirrorTokenType(amountFor) })
    const { send } = await kaikas.swap.swap(swapProps)
    await send()

    // 3. Re-fetch balances
    tokensStore.getUserBalance()
  })

  wheneverTaskErrors(swapTask, (err) => {
    console.error(err)
    $notify({ status: Status.Error, title: `Swap failed: ${String(err)}` })
  })

  wheneverTaskSucceeds(swapTask, () => {
    $notify({ status: Status.Success, title: 'Swap succeeded!' })
  })

  function swap() {
    swapTask.run()
  }

  const swapState = useStaleIfErrorState(swapTask)

  function setToken(type: TokenType, addr: Address | null) {
    selection[type] = { addr, inputRaw: '' }
    triggerGetAmount(true)
  }

  function setBothTokens(pair: TokensPair<Address>) {
    resetSelection(buildPair((type) => ({ inputRaw: '', addr: pair[type] })))
    getAmountFor.value = null
  }

  function setTokenValue(type: TokenType, raw: string) {
    selection[type].inputRaw = raw
    getAmountFor.value = mirrorTokenType(type)
  }

  function reset() {
    selection.tokenA.addr = selection.tokenB.addr = getAmountFor.value = null
    selection.tokenA.inputRaw = selection.tokenB.inputRaw = ''
  }

  return {
    selection,
    selectionTokens,

    isValid,
    validationMessage,

    swap,
    swapState,
    gettingAmountFor,
    gotAmountFor,

    setToken,
    setTokenValue,
    setBothTokens,
    reset,
  }
})

import.meta.hot?.accept(acceptHMRUpdate(useSwapStore, import.meta.hot))
