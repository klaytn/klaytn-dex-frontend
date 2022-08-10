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

export async function buildPairAsync<T>(fn: (type: TokenType) => Promise<T>): Promise<TokensPair<T>> {
  const [tokenA, tokenB] = await Promise.all([fn('tokenA'), fn('tokenB')])
  return { tokenA, tokenB }
}

export function doForPair(fn: (type: TokenType) => void): void {
  fn('tokenA')
  fn('tokenB')
}
