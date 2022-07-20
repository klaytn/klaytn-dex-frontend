import { Opaque } from 'type-fest'

export interface Klaytn {
  enable: () => Promise<Address[]>
  /**
   * https://docs.kaikas.io/02_api_reference/01_klaytn_provider#wallet_watchasset
   */
  sendAsync: (
    params: {
      method: 'wallet_watchAsset'
      params: {
        type: 'ERC20'
        options: {
          address: Address
          symbol: TokenSymbol
          decimals: number
          image?: string
        }
      }
      id: number
    },
    callback?: (err: unknown, result: unknown) => void,
  ) => void
}

export interface Token {
  address: Address
  name: string
  symbol: TokenSymbol
  decimals: number
}

/**
 * Address like `0xb9920BD871e39C6EF46169c32e7AC4C698688881`
 */
export type Address = Opaque<string, 'Address'>

/**
 * A ticker symbol or shorthand, up to 5 chars
 */
export type TokenSymbol = Opaque<string, 'TokenSymbol'>

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
