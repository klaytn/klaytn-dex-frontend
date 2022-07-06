import { Address } from '@/types'
import BigNumber from 'bignumber.js'

export interface Farming {
  id: string
  poolCount: number
  pools: {
    id: string
    pair: string
  }[]
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

export interface Pool {
  id: Address
  name: string
  pairId: Address
  staked: BigNumber
  earned: BigNumber
  balance: BigNumber
  annualPercentageRate: BigNumber
  liquidity: BigNumber
  volume24H: BigNumber
  volume7D: BigNumber
}
