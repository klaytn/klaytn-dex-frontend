import BigNumber from 'bignumber.js'
import { Except, Opaque } from 'type-fest'

/**
 * See https://docs.kaikas.io/02_api_reference/01_klaytn_provider
 */
export interface Kaikas {
  enable: () => Promise<Address[]>

  networkVersion: '1001' | '8217'

  selectedAddress: Address

  sendAsync: (
    params: {
      method: 'wallet_watchAsset'
      params: {
        type: 'ERC20'
        options: {
          address: Address
          symbol: CurrencySymbol
          decimals: number
          image?: string
        }
      }
      id: number
    },
    callback?: (err: unknown, result: unknown) => void,
  ) => void

  on: {
    (event: 'accountsChanged', cb: (accounts: Address[]) => void): void
    (event: 'networkChanged', cb: () => void): void
  }
  removeListener: (event: string, cb: (...args: any[]) => void) => void

  /**
   * https://docs.kaikas.io/02_api_reference/01_klaytn_provider#klaytn._kaikas
   */
  _kaikas: {
    isEnabled: () => boolean
    isApproved: () => Promise<boolean>
    isUnlocked: () => Promise<boolean>
  }
}

export interface Network {
  chainName: string
  chainId: number
  rpcUrl: string
  blockExplorerUrl: string
  nativeToken: Except<Token, 'address'>
}

export interface Token {
  address: Address
  name: string
  symbol: CurrencySymbol
  decimals: number
}

/**
 * Address like `0xb9920BD871e39C6EF46169c32e7AC4C698688881`
 */
export type Address = Opaque<string, 'Address'>

/**
 * A ticker symbol or shorthand, up to 5 chars
 */
export type CurrencySymbol = Opaque<string, 'CurrencySymbol'>

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

export type BigNumberIsh = BigNumber | number | string | bigint
