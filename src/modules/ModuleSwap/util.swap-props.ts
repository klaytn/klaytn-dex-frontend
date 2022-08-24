import { Address, isNativeToken } from '@/core/kaikas'
import { Wei, Route } from '@/core/kaikas/entities'
import { SwapProps, SwapExactAForB, SwapAForExactB } from '@/core/kaikas/Swap'
import { TokenType } from '@/utils/pair'
import invariant from 'tiny-invariant'
import { Except } from 'type-fest'

export interface TokenAddrAndWeiInput {
  addr: Address
  input: Wei
}

export function buildSwapProps({
  route,
  tokenA,
  tokenB,
  referenceToken,
}: {
  route: Route
  tokenA: TokenAddrAndWeiInput
  tokenB: TokenAddrAndWeiInput
  referenceToken: TokenType
}): SwapProps {
  invariant(tokenA.addr !== tokenB.addr, 'Cannot swap token for itself')

  const isTokenANative = isNativeToken(tokenA.addr)
  const isTokenBNative = isNativeToken(tokenB.addr)

  if (referenceToken === 'tokenA') {
    // exact A for B

    const amounts: Except<SwapExactAForB<string, string>, 'mode'> = {
      amountIn: tokenA.input,
      amountOutMin: tokenB.input,
    }

    return isTokenANative
      ? { mode: 'exact-eth-for-tokens', ...amounts, route }
      : isTokenBNative
      ? { mode: 'exact-tokens-for-eth', ...amounts, route }
      : { mode: 'exact-tokens-for-tokens', ...amounts, route }
  } else {
    // A for exact B

    const amounts: Except<SwapAForExactB<string, string>, 'mode'> = {
      // FIXME Where A & B come?
      amountInMax: tokenA.input,
      amountOut: tokenB.input,
    }

    return isTokenANative
      ? { mode: 'eth-for-exact-tokens', ...amounts, route }
      : isTokenBNative
      ? { mode: 'tokens-for-exact-eth', ...amounts, route }
      : { mode: 'tokens-for-exact-tokens', ...amounts, route }
  }
}
