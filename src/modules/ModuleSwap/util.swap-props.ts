import { Address, isNativeToken, Wei } from '@/core'
import { SwapProps, SwapExactAForB, SwapAForExactB } from '@/core/domain/swap'
import { TokenType } from '@/utils/pair'
import invariant from 'tiny-invariant'
import { Except } from 'type-fest'

export interface TokenAddrAndWeiInput {
  addr: Address
  input: Wei
}

export function buildSwapProps({
  tokenA,
  tokenB,
  referenceToken,
}: {
  tokenA: TokenAddrAndWeiInput
  tokenB: TokenAddrAndWeiInput
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
