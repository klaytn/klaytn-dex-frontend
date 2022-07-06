import { acceptHMRUpdate, defineStore } from 'pinia'
import invariant from 'tiny-invariant'
import { useTask } from '@vue-kakuyaku/core'
import { Address, isNativeToken, Kaikas, tokenRawToWei, ValueWei } from '@/core/kaikas'
import { SwapExactAForB, SwapAForExactB, SwapProps } from '@/core/kaikas/Swap'
import { Except } from 'type-fest'

type TokenType = 'tokenA' | 'tokenB'

function mirrorTokenType(type: TokenType): TokenType {
  return type === 'tokenA' ? 'tokenB' : 'tokenA'
}

async function getAmountOfOtherToken(props: {
  kaikas: Kaikas
  exact: { type: TokenType; value: ValueWei<string> }
  tokenA: Address
  tokenB: Address
}): Promise<ValueWei<string>> {
  const addrsPair = { addressA: props.tokenA, addressB: props.tokenB }

  if (props.exact.type === 'tokenA') {
    const [, amount] = await props.kaikas.swap.getAmounts({
      mode: 'out',
      amountIn: props.exact.value,
      ...addrsPair,
    })

    return amount
  } else {
    const [amount] = await props.kaikas.swap.getAmounts({
      mode: 'in',
      amountOut: props.exact.value,
      ...addrsPair,
    })

    return amount
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

export const useSwapStore = defineStore('swap', () => {
  const kaikasStore = useKaikasStore()

  const selection = reactive<Record<TokenType, TokenInputData | null>>({
    tokenA: null,
    tokenB: null,
  })

  const exactToken = ref<null | TokenType>(null)

  function getSelectionAndExactTokenAnyway() {
    const { tokenA, tokenB } = selection
    invariant(tokenA && tokenB, 'Both tokens should be selected')

    const exact = exactToken.value
    invariant(exact, 'Exact token should be set')

    return { tokenA, tokenB, exactToken: exact }
  }

  const getAmountTask = useTask(async () => {
    const kaikas = kaikasStore.getKaikasAnyway()
    const { tokenA, tokenB, exactToken } = getSelectionAndExactTokenAnyway()

    const amount = await getAmountOfOtherToken({
      kaikas,
      exact: {
        type: exactToken,
        value: selection[exactToken]!.inputWei,
      },
      tokenA: tokenA.addr,
      tokenB: tokenB.addr,
    })

    selection[mirrorTokenType(exactToken)]!.inputWei = amount
  })

  function getAmount() {
    getAmountTask.run()
  }

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
    // TODO
  })

  function swap() {
    swapTask.run()
  }

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
    swap,
    getAmount,

    setToken,
    setTokenValue,
    reset,
  }
})

import.meta.hot?.accept(acceptHMRUpdate(useSwapStore, import.meta.hot))
