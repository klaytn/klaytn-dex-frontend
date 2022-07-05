export interface Pool {
  id: string
  pair: string
}

export interface Farming {
  id: string
  poolCount: number
  pools: Pool[]
}

export interface FarmingsQueryResult {
  farmings: Farming[]
}

export interface Pair {
  id: string
  name: string
  dayData: { volumeUSD: string }[]
  reserveUSD: string
}

export interface PairsQueryResult {
  pairs: Pair[]
}

export interface UserInfo {
  amount: string
  rewardDebt: string
}

export interface LiquidityPosition {
  liquidityTokenBalance: string
  pair: {
    id: string
  }
}

export interface LiquidityPositionsQueryResult {
  user: {
    liquidityPositions: LiquidityPosition[]
  }
}

export interface FilledPool {
  id: string
  pair: {
    id: string
    name: string
    icons: string[]
    dayData: { volumeUSD: string }[]
    reserveUSD: string
  },
  stats: {
    earned: string,
    APR: string,
    liquidity: string,
    volume24H: string,
    volume7D: string,
  },
  userInfo: UserInfo,
  liquidityPosition: LiquidityPosition,
  isStaked: boolean
}
