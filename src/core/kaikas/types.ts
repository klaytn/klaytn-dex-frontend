import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import { Opaque } from 'type-fest'

export interface Klaytn {
  enable: () => Promise<Address[]>
}

export interface Token {
  address: Address
  name: string

  /**
   * FIXME describe. What is the difference between `value` and `balance`?
   * Is it ether value?
   *
   * TODO should be removed from here completely
   */
  // value?: string

  /**
   * FIXME describe
   */
  symbol: string

  decimals: number

  /**
   * TODO should be removed from here too
   * it is a temporary value, but `Token` seems to be generally static
   */
  // balance: Balance

  // /**
  //  * FIXME what is a price? Why it is `-`? Should be typed stricter
  //  * maybe from CoinMarketCap too
  //  */
  // price?: string

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
 *
 * **upd**: also see `src/components/TokenSelect/Modal.vue`
 */
export type Balance<T extends AnyNumber = string> = ValueWei<T>

export type AnyNumber = number | string | BN | BigNumber

export type ValueEther<T extends AnyNumber = AnyNumber> = Opaque<T, 'ValueEther'>

export type ValueWei<T extends AnyNumber = AnyNumber> = Opaque<T, 'ValueWei'>

/**
 * FIXME in liquidity store it is usually computed as:
 *
 * ```ts
 * Math.floor(Date.now() / 1000 + 300)
 * ```
 *
 * So... it seems to be a unix epoch time in seconds
 */
export type Deadline = Opaque<number, 'Deadline'>

// /**
//  * FIXME describe all internals
//  *
//  */
// export interface Pair {
//   userBalance: Balance
//   pairBalance: Balance
//   symbol: string
//   name: string
//   reserves: {
//     _reserve0: string
//     _reserve1: string
//     _blockTimestampLast: string
//     0: string
//     1: string
//     2: string
//   }
//   address: Address
//   symbolA?: string | undefined
//   symbolB?: string | undefined
// }
