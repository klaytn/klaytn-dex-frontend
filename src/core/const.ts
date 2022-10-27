import Percent from './entities/Percent'
import Currency from './entities/Currency'
import type { Token, Address, CurrencySymbol, Network } from './types'

export const MAX_UINT256 = 2n ** 256n - 1n

/**
 * Klay token address
 */
export const NATIVE_TOKEN = '0x73365f8f27de98d7634be67a167f229b32e7bf6c' as Address
export const NATIVE_TOKEN_DECIMALS = 18

export const DEX_TOKEN = '0x42f127458246b1db8d8a58d31a22b307408439e4' as Address
export const DEX_TOKEN_DECIMALS = 18

export const ADDRESS_ROUTER = '0xce12c887fae83a5f94f6cf3c8d4c1cee8b1c7786' as Address
export const ADDRESS_FACTORY = '0x339ba51a3d65ad5418aee14b0546088bfe99403c' as Address
export const ADDRESS_WETH = '0x73365f8f27de98d7634be67a167f229b32e7bf6c' as Address
export const ADDRESS_MULTICALL = '0x4d25d48f8a072446c3aa84ba482092a0bea0bf5d' as Address
export const ADDRESS_FARMING = '0xf68b8d3fae7FEB747cB4dCe0a4c91A100B140245' as Address

/**
 * We totally sure that all our LP tokens have this decimals value
 */
export const LP_TOKEN_DECIMALS = 18

/**
 * Data comes from:
 * https://docs.klaytn.foundation/dapp/tutorials/connecting-metamask#connect-to-klaytn-network
 */
export const NETWORK: Network = Object.freeze({
  chainName: 'Klaytn Baobab',
  chainId: 1001,
  rpcUrl: 'https://api.baobab.klaytn.net:8651/',
  blockExplorerUrl: 'https://baobab.scope.klaytn.com/',
  nativeToken: {
    name: 'KLAY',
    symbol: 'KLAY' as CurrencySymbol,
    decimals: NATIVE_TOKEN_DECIMALS,
  },
})

/**
 * It is static and equals 0.3%
 */
export const POOL_COMMISSION = new Percent(3, 1000)

export const TRADE_MAX_HOPS = 3

export const TRADE_MAX_NUM_RESULTS = 3

export const TRADE_MAX_PRICE_IMPACT = new Percent(1, 10)

export const CURRENCY_USD = new Currency(2, 'USD' as CurrencySymbol, 'US Dollars')

const EXPLORER_BASE = `https://baobab.klaytnfinder.io`

export function makeExplorerLinkToAccount(address: Address): string {
  return `${EXPLORER_BASE}/account/${address}`
}

export function makeExplorerLinkToTransaction(address: Address): string {
  return `${EXPLORER_BASE}/tx/${address}`
}

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const NATIVE_TOKEN_FULL = {
  address: NATIVE_TOKEN,
  name: 'KLAY',
  symbol: 'KLAY',
  decimals: NATIVE_TOKEN_DECIMALS,
} as Token

export const DEX_TOKEN_FULL: Token = {
  address: DEX_TOKEN,
  decimals: DEX_TOKEN_DECIMALS,
  symbol: 'DEX' as CurrencySymbol,
  name: 'DEX Token',
}

export const WHITELIST_TOKENS = Object.freeze([
  NATIVE_TOKEN_FULL,
  DEX_TOKEN_FULL,
  {
    address: '0xb9920BD871e39C6EF46169c32e7AC4C698688881',
    name: 'Mercury',
    symbol: 'MER',
    decimals: 18,
  },
  {
    address: '0x1CDcD477994e86A11E21C27ca907bEA266EA3A0a',
    name: 'Venus',
    symbol: 'VEN',
    decimals: 18,
  },
  {
    address: '0x2486A551714F947C386Fe9c8b895C2A6b3275EC9',
    name: 'Earth',
    symbol: 'EA',
    decimals: 18,
  },
  {
    address: '0xAFea7569B745EaE7AB22cF17c3B237c3350407A1',
    name: 'Mars',
    symbol: 'ARS',
    decimals: 18,
  },
  {
    address: '0xC20A9eB22de0C6920619aDe93A11283C2a07273e',
    name: 'Jupiter',
    symbol: 'JUP',
    decimals: 18,
  },
  {
    address: '0xce77229fF8451f5791ef4Cc2a841735Ed4edc3cA',
    name: 'Saturn',
    symbol: 'SAT',
    decimals: 18,
  },
  {
    address: '0xFbcb69f52D6A08C156c543Dd4Dc0521F5F545755',
    name: 'Uranus',
    symbol: 'URA',
    decimals: 18,
  },
  {
    address: '0x7cB550723972d7F29b047D6e71b62DcCcAF93992',
    name: 'Neptune',
    symbol: 'NEP',
    decimals: 18,
  },
  {
    address: '0xcdBD333BDBB99bC80D77B10CCF74285a97150E5d',
    name: 'Pluto',
    symbol: 'PL',
    decimals: 18,
  },
  {
    address: '0x246C989333Fa3C3247C7171F6bca68062172992C',
    name: 'Io',
    symbol: 'IO',
    decimals: 18,
  },
] as Token[])

export function isNativeToken(address: Address): boolean {
  return address.toLowerCase() === NATIVE_TOKEN.toLowerCase()
}

export function sortKlayPair(tokenA: Token, tokenB: Token) {
  if (isNativeToken(tokenA.address)) return [tokenB, tokenA]

  return [tokenA, tokenB]
}
