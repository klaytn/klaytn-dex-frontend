import { Opaque } from 'type-fest'

export interface Klaytn {
  /**
   * FIXME is it async? Does it return {@link Address}?
   */
  enable: () => string[]
}

export interface Token {
  address: Address
  value: string
  name: string
  price?: string
  symbol: string
  balance: string
}

export type Address = Opaque<string, 'Address'>

/**
 * TODO describe
 */
export interface Pair {
  userBalance: string
  pairBalance: string
  symbol: string
  name: string
  reserves: {
    _reserve0: string
    _reserve1: string
    _blockTimestampLast: string
    0: string
    1: string
    2: string
  }
  address: Address
  symbolA?: string | undefined
  symbolB?: string | undefined
}
