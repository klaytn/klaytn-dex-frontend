export type TokenType = 'tokenA' | 'tokenB'

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

export function doForPair(fn: (type: TokenType) => void): void {
  fn('tokenA')
  fn('tokenB')
}
