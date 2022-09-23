import { Wei, Address, isNativeToken, Trade } from '@/core'
import { SwapProps } from '@/core/domain/swap'
import { TokenType } from '@/utils/pair'
import invariant from 'tiny-invariant'

export interface TokenAddrAndWeiInput {
  addr: Address
  input: Wei
}

export function buildSwapProps({
  trade,
  tokenA,
  tokenB,
  referenceToken,
}: {
  trade: Trade
  tokenA: TokenAddrAndWeiInput
  tokenB: TokenAddrAndWeiInput
  referenceToken: TokenType
}): SwapProps {
  invariant(tokenA.addr !== tokenB.addr, 'Cannot swap token for itself')

  const isTokenANative = isNativeToken(tokenA.addr)
  const isTokenBNative = isNativeToken(tokenB.addr)

  if (referenceToken === 'tokenA') {
    // exact A for B

    const rest = {
      amountIn: tokenA.input,
      amountOutMin: tokenB.input,
      trade,
    }

    return isTokenANative
      ? { mode: 'exact-eth-for-tokens', ...rest }
      : isTokenBNative
      ? { mode: 'exact-tokens-for-eth', ...rest }
      : { mode: 'exact-tokens-for-tokens', ...rest }
  } else {
    // A for exact B

    const rest = {
      amountInMax: tokenA.input,
      amountOut: tokenB.input,
      trade,
    }

    return isTokenANative
      ? { mode: 'eth-for-exact-tokens', ...rest }
      : isTokenBNative
      ? { mode: 'tokens-for-exact-eth', ...rest }
      : { mode: 'tokens-for-exact-tokens', ...rest }
  }
}
