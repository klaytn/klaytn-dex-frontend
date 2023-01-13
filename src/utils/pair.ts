import type { Address } from '@/core'
import { areAddressesEqual, areNullableAddressesEqual } from '@/core/utils'

export const TOKEN_TYPES = ['tokenA', 'tokenB'] as const

export type TokenType = typeof TOKEN_TYPES[number]

export function mirrorTokenType(type: TokenType): TokenType {
  return type === 'tokenA' ? 'tokenB' : 'tokenA'
}

export type TokensPair<T> = Record<TokenType, T>

export function buildPair<T>(fn: (type: TokenType) => T): TokensPair<T> {
  return {
    tokenA: fn('tokenA'),
    tokenB: fn('tokenB'),
  }
}

export function emptyPair(): TokensPair<null> {
  return buildPair(() => null)
}

export async function buildPairAsync<T>(fn: (type: TokenType) => Promise<T>): Promise<TokensPair<T>> {
  const [tokenA, tokenB] = await Promise.all([fn('tokenA'), fn('tokenB')])
  return { tokenA, tokenB }
}

export function doForPair(fn: (type: TokenType) => void): void {
  fn('tokenA')
  fn('tokenB')
}

export function nonNullPair<T>(pair: null | TokensPair<null | undefined | T>): null | TokensPair<T> {
  if (pair?.tokenA && pair?.tokenB) return pair as TokensPair<T>
  return null
}

export type Pair01<T> = Record<`token${0 | 1}`, T>

// export function mapPairTo01<T>(pair: TokensPair<T>, token0: Address, tokenA: Address): Pair01<T> {}

export function map01ToPair<T>(pair: Pair01<T>, token0: Address, tokenA: Address): TokensPair<T> {
  const ab = [pair.token0, pair.token1] as [T, T]
  !areAddressesEqual(token0, tokenA) && ab.reverse()
  return { tokenA: ab[0], tokenB: ab[1] }
}

export function areAddrTokenPairsEqual(a: TokensPair<Address | null>, b: TokensPair<Address | null>) {
  return areNullableAddressesEqual(a.tokenA, b.tokenA) && areNullableAddressesEqual(a.tokenB, b.tokenB)
}
