import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import { Opaque } from 'type-fest'

export interface Klaytn {
  /**
   * FIXME is it async? Does it return {@link Address}?
   */
  enable: () => string[]
}

export interface Token {
  name: string
  address: Address

  /**
   * FIXME describe. What is the difference between `value` and `balance`?
   * Is it ether value?
   */
  value?: string

  /**
   * FIXME describe
   */
  symbol: string
  balance: Balance

  /**
   * FIXME what is a price? Why it is `-`? Should be typed stricter
   * maybe from CoinMarketCap too
   */
  price?: string

  // rudiment from CoinMarketCap integration
  // logo?: string
  // slug?: string

  // /**
  //  * Address too? Usually is the same as `address` field
  //  */
  // id?: Address
}

/**
 * Address like `0xb9920BD871e39C6EF46169c32e7AC4C698688881`
 */
export type Address = Opaque<string, 'Address'>

/**
 * `BigNumber` (from `bignumber.js` package) as a string
 *
 * **upd**: from the context of `src/components/TokenInput/index.vue`, it seems to be a
 * Wei value, because it is passed into `fromWei` function
 */
export type Balance = Opaque<string, 'Balance'>

export type ValueEther<T extends BN | string = BN | string> = Opaque<T, 'ether'>

export type ValueWei<T extends BN | string | BigNumber = BN | string | BigNumber> = Opaque<T, 'wei'>

/**
 * FIXME describe all internals
 */
export interface Pair {
  userBalance: Balance
  pairBalance: Balance
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
