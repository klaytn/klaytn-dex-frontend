import { acceptHMRUpdate, defineStore } from 'pinia'
import { Status } from '@soramitsu-ui/ui'
import invariant from 'tiny-invariant'
import {
  Task,
  useScope,
  useTask,
  useStaleIfErrorState,
  wheneverTaskErrors,
  wheneverTaskSucceeds,
} from '@vue-kakuyaku/core'
import {
  Address,
  isEmptyAddress,
  isNativeToken,
  Kaikas,
  tokenRawToWei,
  tokenWeiToRaw,
  ValueWei,
  asWei,
  Token,
} from '@/core/kaikas'
import { SwapExactAForB, SwapAForExactB, SwapProps } from '@/core/kaikas/Swap'
import { Except } from 'type-fest'
import { Ref } from 'vue'
import BigNumber from 'bignumber.js'
import { WHITELIST_TOKENS } from '@/core/kaikas/const'
import { TokenType, TokensPair, buildPair, mirrorTokenType, doForPair } from '@/utils/pair'
import Debug from 'debug'

const debugRoot = Debug('swap-store')

interface GetAmountProps extends TokensPair<Address> {
  amountFor: TokenType
  referenceValue: ValueWei<string>
}

async function getAmount(props: GetAmountProps & { kaikas: Kaikas }): Promise<ValueWei<string>> {
  const addrsPair = { addressA: props.tokenA, addressB: props.tokenB }

  const refValue = props.referenceValue

  if (props.amountFor === 'tokenB') {
    const [, amountOut] = await props.kaikas.swap.getAmounts({
      mode: 'out',
      amountIn: refValue,
      ...addrsPair,
    })

    return amountOut
  } else {
    const [amountIn] = await props.kaikas.swap.getAmounts({
      mode: 'in',
      amountOut: refValue,
      ...addrsPair,
    })

    return amountIn
  }
}

interface InputRaw {
  addr: Address | null
  inputRaw: string
}

interface InputWei {
  addr: Address
  input: ValueWei<string>
}

function buildSwapProps({
  tokenA,
  tokenB,
  referenceToken,
}: {
  tokenA: InputWei
  tokenB: InputWei
  referenceToken: TokenType
}): SwapProps {
  invariant(tokenA.addr !== tokenB.addr, 'Cannot swap token for itself')

  const addrs = { addressA: tokenA.addr, addressB: tokenB.addr }
  const isTokenANative = isNativeToken(tokenA.addr)
  const isTokenBNative = isNativeToken(tokenB.addr)

  if (referenceToken === 'tokenA') {
    // exact A for B

    const amounts: Except<SwapExactAForB<string, string>, 'mode'> = {
      amountIn: tokenA.input,
      amountOutMin: tokenB.input,
    }

    return isTokenANative
      ? { mode: 'exact-eth-for-tokens', ...amounts, ...addrs }
      : isTokenBNative
      ? { mode: 'exact-tokens-for-eth', ...amounts, ...addrs }
      : { mode: 'exact-tokens-for-tokens', ...amounts, ...addrs }
  } else {
    // A for exact B

    const amounts: Except<SwapAForExactB<string, string>, 'mode'> = {
      // FIXME Where A & B come?
      amountInMax: tokenA.input,
      amountOut: tokenB.input,
    }

    return isTokenANative
      ? { mode: 'eth-for-exact-tokens', ...amounts, ...addrs }
      : isTokenBNative
      ? { mode: 'tokens-for-exact-eth', ...amounts, ...addrs }
      : { mode: 'tokens-for-exact-tokens', ...amounts, ...addrs }
  }
}

if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest

  const someNonNativeToken1 = '0xb9920BD871e39C6EF46169c32e7AC4C698688881' as Address
  const someNonNativeToken2 = '0x1CDcD477994e86A11E21C27ca907bEA266EA3A0a' as Address

  describe('Building swap props', () => {
    test('When token A is exact, and none of tokens are native', () => {
      expect(
        buildSwapProps({
          tokenA: {
            addr: someNonNativeToken1,
            input: tokenRawToWei({ decimals: 18 }, '1.423'),
          },
          tokenB: {
            addr: someNonNativeToken2,
            input: tokenRawToWei({ decimals: 18 }, '45.42'),
          },
          referenceToken: 'tokenA',
        }),
      ).toMatchInlineSnapshot(`
            {
              "addressA": "0xb9920BD871e39C6EF46169c32e7AC4C698688881",
              "addressB": "0x1CDcD477994e86A11E21C27ca907bEA266EA3A0a",
              "amountIn": "1423000000000000000",
              "amountOutMin": "45420000000000000000",
              "mode": "exact-tokens-for-tokens",
            }
          `)
    })

    // TODO cover other cases

    test('Fails if tokens are the same', () => {
      expect(() =>
        buildSwapProps({
          tokenA: {
            addr: someNonNativeToken1,
            input: '0' as ValueWei<string>,
          },
          tokenB: {
            addr: someNonNativeToken1,
            input: '0' as ValueWei<string>,
          },
          referenceToken: 'tokenA',
        }),
      ).toThrowErrorMatchingInlineSnapshot('"Invariant failed: Cannot swap token for itself"')
    })
  })
}

function usePairAddress(
  pair: TokensPair<Address | null | undefined>,
): Ref<null | Task<{ pair: Address; isEmpty: boolean }>> {
  const kaikasStore = useKaikasStore()

  const key = computed<null | string>(() => {
    const a = pair.tokenA ?? null
    const b = pair.tokenB ?? null
    return a && b && (kaikasStore.isConnected || null) && `${a}-${b}`
  })

  const scope = useScope<Task<{ pair: Address; isEmpty: boolean }>, string>(key, () => {
    const kaikas = kaikasStore.getKaikasAnyway()
    const a = pair.tokenA!
    const b = pair.tokenB!

    const task = useTask(async () => {
      const pair = await kaikas.tokens.getPairAddress(a, b)
      const isEmpty = isEmptyAddress(pair)
      return { pair, isEmpty }
    })

    task.run()

    useTaskLog(task, 'pair-addr')

    return task
  })

  return computed(() => scope.value?.setup ?? null)
}

function useGetAmount(props: Ref<null | GetAmountProps>) {
  const debug = debugRoot.extend('use-get-amount')

  const kaikasStore = useKaikasStore()

  const computedKey = computed<string | null>(() => {
    const val = props.value
    if (!val) return null
    return `${val.tokenA}-${val.tokenB}-for-${val.amountFor}-${val.referenceValue}`
  })
  const taskKey = ref<null | string>(computedKey.value)
  function updateKey() {
    taskKey.value = computedKey.value
  }
  const updateKeyDebounced = useDebounceFn(updateKey, 500)
  function update(immediate = false) {
    debug('update', { immediate })
    immediate ? updateKey() : updateKeyDebounced()
  }
  watch(computedKey, (key) => {
    debug('computed key updated:', key)
    taskKey.value = null
    update()
  })

  const taskScope = useScope(taskKey, () => {
    const kaikas = kaikasStore.getKaikasAnyway()
    const propsVal = props.value
    invariant(propsVal)
    debug('task scope setup. props: %o')

    const task = useTask(async () => {
      const amount = await getAmount({
        kaikas,
        ...propsVal,
      })

      return { amount }
    })

    task.run()
    useTaskLog(task, `get-amounts`)

    return { task, props: propsVal }
  })

  const gettingAmountFor = computed<null | TokenType>(() => {
    if (taskScope.value?.setup.task.state.kind === 'pending') return taskScope.value.setup.props.amountFor
    return null
  })

  const gotAmountFor = computed<null | { type: TokenType; amount: ValueWei<string> }>(() => {
    const setup = taskScope.value?.setup

    return setup?.task.state.kind === 'ok'
      ? {
          amount: setup.task.state.data.amount,
          type: setup.props.amountFor,
        }
      : null
  })

  return { gotAmountFor, gettingAmountFor, trigger: update }
}

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

type PairAddressResult = 'unknown' | 'empty' | 'not-empty'

function useSwapValidation({
  tokenA,
  tokenB,
  pairAddr,
}: {
  tokenA: Ref<(Token & { balance: ValueWei<BigNumber>; input: ValueWei<string> }) | null>
  tokenB: Ref<Token | null>
  pairAddr: Ref<PairAddressResult>
}): Ref<{ kind: 'ok' } | { kind: 'err'; message: string }> {
  const err = (message: string) => ({ kind: 'err' as const, message })

  return computed(() => {
    if (!tokenA.value || !tokenB.value) return err('Select Token')

    if (pairAddr.value === 'unknown') {
      return err('Route is not computed yet')
    }

    if (pairAddr.value === 'empty') {
      return err(`Route ${tokenA.value.symbol}>${tokenB.value.symbol} not found`)
    }

    if (tokenA.value.balance.isLessThan(new BigNumber(tokenA.value.input))) {
      return err(`Insufficient ${tokenA.value.symbol} balance`)
    }

    return { kind: 'ok' }
  })
}

if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest

  const getTwoTokens = () => WHITELIST_TOKENS.slice(2, 4)

  describe('swap validation', () => {
    test('When some token is not selected, "Select Token" returned', () => {
      const [tokenA] = getTwoTokens()

      const validation = useSwapValidation({
        tokenA: shallowRef({ ...tokenA, balance: asWei(new BigNumber(0)), input: asWei('141234234000000') }),
        tokenB: shallowRef(null),
        pairAddr: ref('unknown'),
      })

      expect(validation.value).toMatchInlineSnapshot(`
        {
          "kind": "err",
          "message": "Select Token",
        }
      `)
    })

    test('When pair is not computed yet, validation errors', () => {
      const [tokenA, tokenB] = getTwoTokens()

      const validation = useSwapValidation({
        tokenA: shallowRef({ ...tokenA, balance: asWei(new BigNumber(0)), input: asWei('0') }),
        tokenB: shallowRef(tokenB),
        pairAddr: ref('unknown'),
      })

      expect(validation.value).toMatchInlineSnapshot(`
        {
          "kind": "err",
          "message": "Route is not computed yet",
        }
      `)
    })

    test("When tokens are selected, but pair doesn't exist, route error is returned", () => {
      const [tokenA, tokenB] = getTwoTokens()
      const tokens = { tokenA, tokenB }

      const validation = useSwapValidation({
        tokenA: shallowRef({ ...tokenA, balance: asWei(new BigNumber(0)), input: asWei('0') }),
        tokenB: shallowRef(tokenB),
        pairAddr: ref('empty'),
      })

      expect(validation.value).toMatchInlineSnapshot(`
        {
          "kind": "err",
          "message": "Route VEN>EA not found",
        }
      `)
    })

    test('When tokens are the same, validation fails', () => {
      const [tokenA] = getTwoTokens()

      const validation = useSwapValidation({
        tokenA: shallowRef({ ...tokenA, balance: asWei(new BigNumber(0)), input: asWei('0') }),
        tokenB: shallowRef(tokenA),
        pairAddr: ref('empty'),
      })

      expect(validation.value).toMatchInlineSnapshot(`
        {
          "kind": "err",
          "message": "Route VEN>VEN not found",
        }
      `)
    })

    test('When tokenA balance is insufficient, validation fails', () => {
      const [tokenA, tokenB] = getTwoTokens()

      const INPUT = asWei('1001')
      const BALANCE = asWei('1000')

      const validation = useSwapValidation({
        tokenA: shallowRef({ ...tokenA, balance: asWei(new BigNumber(BALANCE)), input: INPUT }),
        tokenB: shallowRef(tokenB),
        pairAddr: ref('not-empty'),
      })

      expect(validation.value).toMatchInlineSnapshot(`
        {
          "kind": "err",
          "message": "Insufficient VEN balance",
        }
      `)
    })
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

  const selectionAddrs = reactive(buildPair((type) => computed(() => selection[type]?.addr)))

  const selectionTokens = reactive(
    buildPair((type) =>
      computed(() => {
        const addr = selection[type]?.addr
        return addr ? tokensStore.tryFindToken(addr) ?? null : null
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
  watchEffect(() => {
    const result = gotAmountFor.value
    if (result) {
      const { type: amountFor, amount } = result
      const tokenData = selectionTokens[amountFor]
      if (tokenData) {
        debugRoot('Setting computed amount %o for %o', amount, amountFor)
        const raw = tokenWeiToRaw(tokenData, amount)
        selection[amountFor].inputRaw = new BigNumber(raw).toFixed(5)
      }
    }
  })

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
    reset,
  }
})

import.meta.hot?.accept(acceptHMRUpdate(useSwapStore, import.meta.hot))
