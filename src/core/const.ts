import Percent from './entities/Percent'
import Currency from './entities/Currency'
import type { Address, CurrencySymbol, Token } from './types'
import { areAddressesEqual } from './utils'
import CONFIG from '~config'

export const {
  tokens: WHITELIST_TOKENS,
  tokenDex: DEX_TOKEN_FULL,
  tokenNative: NATIVE_TOKEN_FULL,
  network: NETWORK,
  smartcontracts: {
    router: ADDRESS_ROUTER,
    factory: ADDRESS_FACTORY,
    weth: ADDRESS_WETH,
    multicall: ADDRESS_MULTICALL,
    farming: ADDRESS_FARMING,
  },
} = CONFIG

export const { address: NATIVE_TOKEN, decimals: NATIVE_TOKEN_DECIMALS } = NATIVE_TOKEN_FULL
export const { address: DEX_TOKEN, decimals: DEX_TOKEN_DECIMALS } = DEX_TOKEN_FULL

export const MAX_UINT256 = 2n ** 256n - 1n

/**
 * We totally sure that all our LP tokens have this decimals value
 */
export const LP_TOKEN_DECIMALS = 18

/**
 * It is static and equals 0.3%
 */
export const POOL_COMMISSION = new Percent(3, 1000)

export const TRADE_MAX_HOPS = 3

export const TRADE_MAX_NUM_RESULTS = 3

export const TRADE_MAX_PRICE_IMPACT = new Percent(1, 10)

export const CURRENCY_USD = new Currency(3, 'USD' as CurrencySymbol, 'US Dollars')

export function makeExplorerLinkToAccount(address: Address): string {
  return `${NETWORK.blockExplorerUrl}/account/${address}`
}

export function makeExplorerLinkToTransaction(address: Address): string {
  return `${NETWORK.blockExplorerUrl}/tx/${address}`
}

export function isNativeToken(address: Address): boolean {
  return areAddressesEqual(address, NATIVE_TOKEN)
}

export function sortKlayPair(tokenA: Token, tokenB: Token) {
  if (isNativeToken(tokenA.address)) return [tokenB, tokenA]

  return [tokenA, tokenB]
}
