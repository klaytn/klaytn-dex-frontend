import Percent from './entities/Percent'
import type { Token, Address, TokenSymbol, Network } from './types'

export const MAX_UINT256 = 2n ** 256n - 1n

/**
 * Klay token address
 */
export const NATIVE_TOKEN = '0xae3a8a1D877a446b22249D8676AFeB16F056B44e' as Address
export const NATIVE_TOKEN_DECIMALS = 18

export const ADDRESS_ROUTER = '0xB0B695584234F2CC16266588b2b951F3d2885705' as Address
export const ADDRESS_FACTORY = '0xEB487a3A623E25cAa668B6D199F1aBa9D2380456' as Address
export const ADDRESS_WETH = '0xae3a8a1D877a446b22249D8676AFeB16F056B44e' as Address
export const ADDRESS_MULTICALL = '0xc88098CEaE07D1FE443372a0accC464A5fb94668' as Address
export const ADDRESS_FARMING = '0x32bE07FB9dBf294c2e92715F562f7aBA02b7443A' as Address

export const ADDRESS_REWARD_TOKEN = '0x825e1ba886c90f15a921a7ac9b19b6d645fa2429' as Address

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
    symbol: 'KLAY' as TokenSymbol,
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

const EXPLORER_BASE = `https://baobab.klaytnfinder.io`

export function makeExplorerLinkToAccount(address: Address): string {
  return `${EXPLORER_BASE}/account/${address}`
}

export function makeExplorerLinkToTransaction(address: Address): string {
  return `${EXPLORER_BASE}/tx/${address}`
}

export const WHITELIST_TOKENS = Object.freeze([
  {
    address: NATIVE_TOKEN,
    // name: 'Wrapped KLAY',
    // symbol: 'WKLAY',
    name: 'KLAY',
    symbol: 'KLAY',
    decimals: NATIVE_TOKEN_DECIMALS,
  },
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
