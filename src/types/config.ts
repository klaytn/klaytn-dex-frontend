import type { Address, Network, Token } from '../core/types'

export interface ConfigParsed {
  /**
   * Assume that Native and DEX tokens are included here too
   */
  tokens: Token[]
  tokenNative: Token
  tokenDex: Token
  network: Network
  smartcontracts: {
    router: Address
    factory: Address
    weth: Address
    multicall: Address
    farming: Address
  }
  /**
   * GraphQL URIs
   */
  subgraphs: {
    exchange: string
    farming: string
    staking: string
    snapshot: string
  }
  /**
   * Used for proposals
   */
  snapshotSpace: string
  uriDashboards: string
  uriConnectWalletGuide: string
  uriIPFS: string
}
