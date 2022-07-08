import { acceptHMRUpdate, defineStore } from 'pinia'
import invariant from 'tiny-invariant'
import {
  Task,
  useScope,
  useTask,
  useStaleIfErrorState,
  useDanglingScope,
  wheneverTaskSucceeds,
} from '@vue-kakuyaku/core'
import { Address, isEmptyAddress, isNativeToken, Kaikas, tokenRawToWei, ValueWei } from '@/core/kaikas'
import { SwapExactAForB, SwapAForExactB, SwapProps } from '@/core/kaikas/Swap'
import { Except } from 'type-fest'
import { MaybeRef } from '@vueuse/core'
import { Ref } from 'vue'

export type TokenType = 'tokenA' | 'tokenB'

function mirrorTokenType(type: TokenType): TokenType {
  return type === 'tokenA' ? 'tokenB' : 'tokenA'
}

export type TokensPair<T> = Record<TokenType, T>

export function buildPair<T>(fn: (type: TokenType) => T): TokensPair<T> {
  return {
    tokenA: fn('tokenA'),
    tokenB: fn('tokenB'),
  }
}

interface GetAmountOfOtherTokenProps extends TokensPair<Address> {
  kaikas: Kaikas
  exact: { type: TokenType; value: ValueWei<string> }
}

async function getAmountOfOtherToken(props: GetAmountOfOtherTokenProps): Promise<ValueWei<string>> {
  const addrsPair = { addressA: props.tokenA, addressB: props.tokenB }

  if (props.exact.type === 'tokenA') {
    const [, amountOut] = await props.kaikas.swap.getAmounts({
      mode: 'out',
      amountIn: props.exact.value,
      ...addrsPair,
    })

    return amountOut
  } else {
    const [amountIn] = await props.kaikas.swap.getAmounts({
      mode: 'in',
      amountOut: props.exact.value,
      ...addrsPair,
    })

    return amountIn
  }
}

interface TokenInputData {
  addr: Address
  inputWei: ValueWei<string>
}

function buildSwapProps({
  tokenA,
  tokenB,
  exactToken,
}: {
  tokenA: TokenInputData
  tokenB: TokenInputData
  exactToken: TokenType
}): SwapProps {
  invariant(tokenA.addr !== tokenB.addr, 'Cannot swap token for itself')

  const addrs = { addressA: tokenA.addr, addressB: tokenB.addr }
  const isTokenANative = isNativeToken(tokenA.addr)
  const isTokenBNative = isNativeToken(tokenB.addr)

  if (exactToken === 'tokenA') {
    // exact A for B

    const amounts: Except<SwapExactAForB<string, string>, 'mode'> = {
      amountIn: tokenA.inputWei,
      amountOutMin: tokenB.inputWei,
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
      amountInMax: tokenA.inputWei,
      amountOut: tokenB.inputWei,
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
            inputWei: tokenRawToWei({ decimals: 18 }, '1.423'),
          },
          tokenB: {
            addr: someNonNativeToken2,
            inputWei: tokenRawToWei({ decimals: 18 }, '45.42'),
          },
          exactToken: 'tokenA',
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
            inputWei: '0' as ValueWei<string>,
          },
          tokenB: {
            addr: someNonNativeToken1,
            inputWei: '0' as ValueWei<string>,
          },
          exactToken: 'tokenA',
        }),
      ).toThrowErrorMatchingInlineSnapshot('"Invariant failed: Cannot swap token for itself"')
    })
  })
}

function usePairAddress(
  tokenA: MaybeRef<Address | null | undefined>,
  tokenB: MaybeRef<Address | null | undefined>,
): Ref<null | Task<{ pair: Address; isEmpty: boolean }>> {
  const kaikasStore = useKaikasStore()

  const key = computed<null | string>(() => {
    const a = unref(tokenA) ?? null
    const b = unref(tokenB) ?? null
    return a && b && `${a}-${b}`
  })

  const scope = useScope<Task<{ pair: Address; isEmpty: boolean }>, string>(key, () => {
    const kaikas = kaikasStore.getKaikasAnyway()
    const a = unref(tokenA)!
    const b = unref(tokenB)!

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

function useGetAmount({
  selection,
  exactToken,
}: {
  selection: TokensPair<TokenInputData | null>
  exactToken: Ref<null | TokenType>
}) {
  const kaikasStore = useKaikasStore()

  const scope = useDanglingScope<{ isPending: Ref<boolean> }>()

  type ComputedGetAmountProps = Except<GetAmountOfOtherTokenProps, 'kaikas'> & { key: string }

  const computedProps = computed<ComputedGetAmountProps | null>(() => {
    const { tokenA, tokenB } = selection
    const exact = exactToken.value
    if (!tokenA || !tokenB || !exact) return null

    const exactValue = selection[exact]!.inputWei

    const key = `${tokenA.addr}-${tokenB.addr}-${exact}-${exactValue}`

    return {
      key,
      tokenA: tokenA.addr,
      tokenB: tokenB.addr,
      exact: {
        type: exact,
        value: exactValue,
      },
    }
  })

  watch(
    () => computedProps.value?.key,
    (key) => {
      scope.dispose()
      if (key) {
        const { key, ...props } = computedProps.value!
        taskSetupDebounced(props)
      }
    },
    { immediate: true },
  )

  const taskSetupDebounced = useDebounceFn((props: Except<GetAmountOfOtherTokenProps, 'kaikas'>) => {
    const kaikas = kaikasStore.getKaikasAnyway()

    scope.setup(() => {
      const task = useTask(async () => {
        const amount = await getAmountOfOtherToken({
          kaikas,
          ...props,
        })

        return { amount }
      })

      task.run()

      wheneverTaskSucceeds(task, ({ amount }) => {
        selection[mirrorTokenType(props.exact.type)]!.inputWei = amount
      })

      const isPending = computed<boolean>(() => task.state.kind === 'pending')

      return { isPending }
    })
  }, 700)

  const getAmountPendingState = computed<null | TokenType>(() => {
    if (scope.scope.value?.setup.isPending.value) return exactToken.value!
    return null
  })

  return { pendingState: getAmountPendingState }
}

export const useSwapStore = defineStore('swap', () => {
  const kaikasStore = useKaikasStore()
  const tokensStore = useTokensStore()

  const selection = reactive<TokensPair<TokenInputData | null>>({
    tokenA: null,
    tokenB: null,
  })

  const selectionAddrs = buildPair((type) => computed(() => selection[type]?.addr))

  const selectionTokens = buildPair((type) =>
    computed(() => {
      const addr = selection[type]?.addr
      return addr ? tokensStore.tryFindToken(addr) ?? null : null
    }),
  )

  const pairAddress = usePairAddress(selectionAddrs.tokenA, selectionAddrs.tokenB)
  const isPairAddressEmpty = computed<'empty' | 'non-empty' | 'unknown'>(() => {
    const state = pairAddress.value?.state
    if (state?.kind === 'ok') {
      return state.data.isEmpty ? 'empty' : 'non-empty'
    }
    return 'unknown'
  })

  const selectionBalance = buildPair((type) =>
    computed(() => {
      const addr = selection[type]?.addr
      if (!addr) return null
      return tokensStore.userBalanceMap?.get(addr) ?? null
    }),
  )

  const areSelectedTokensValidToSwap = computed<boolean>(() => {
    const { tokenA, tokenB } = selection
    if (!tokenA || !tokenB) return false

    const areTokensTheSame = tokenA.addr === tokenB.addr
    if (areTokensTheSame) return false

    // checking for both 1) it is loaded and 2) it is not empty
    if (isPairAddressEmpty.value !== 'non-empty') return false

    const {
      tokenA: { value: balanceA },
      tokenB: { value: balanceB },
    } = selectionBalance
    if (!(balanceA?.isGreaterThanOrEqualTo(0) && balanceB?.isGreaterThanOrEqualTo(0))) return false

    return true
  })

  const exactToken = ref<null | TokenType>(null)

  function getSelectionAndExactTokenAnyway() {
    const { tokenA, tokenB } = selection
    invariant(tokenA && tokenB, 'Both tokens should be selected')

    const exact = exactToken.value
    invariant(exact, 'Exact token should be set')

    return { tokenA, tokenB, exactToken: exact }
  }

  const { pendingState: getAmountPendingState } = useGetAmount({ selection, exactToken })

  const swapTask = useTask(async () => {
    const kaikas = kaikasStore.getKaikasAnyway()
    const { tokenA, tokenB, exactToken } = getSelectionAndExactTokenAnyway()

    // 1. Approve amount of the tokenA
    await kaikas.cfg.approveAmount(tokenA.addr, tokenA.inputWei)

    // 2. Perform swap according to which token is "exact" and if
    // some of them is native
    const swapProps = buildSwapProps({ tokenA, tokenB, exactToken })
    const { send } = await kaikas.swap.swap(swapProps)
    await send()

    // 3. Re-fetch balances
    tokensStore.getUserBalance()
  })

  function swap() {
    swapTask.run()
  }

  const swapState = useStaleIfErrorState(swapTask)

  function setToken(type: TokenType, addr: Address) {
    selection[type] = { addr, inputWei: '0' as ValueWei<string> }
  }

  function setTokenValue(type: TokenType, wei: ValueWei<string>) {
    const token = selection[type]
    invariant(token)
    token.inputWei = wei
    exactToken.value = type
  }

  function reset() {
    selection.tokenA = selection.tokenB = exactToken.value = null
  }

  return {
    selection,
    selectionTokens,
    isEmptyPairAddress: isPairAddressEmpty,
    areSelectedTokensValidToSwap,

    swap,
    swapState,
    getAmountPendingState,

    setToken,
    setTokenValue,
    reset,
  }
})

import.meta.hot?.accept(acceptHMRUpdate(useSwapStore, import.meta.hot))
