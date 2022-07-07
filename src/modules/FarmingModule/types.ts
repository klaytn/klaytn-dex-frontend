import { Address } from '@/types'
import BigNumber from 'bignumber.js'

export interface FarmingsQueryResult {
  farming: {
    id: string
    poolCount: number
    pools: {
      id: string
      pair: string
      users: {
        pool: {
          id: string
        }
        amount: string
      }[]
    }[]
  }
}

export interface PairsQueryResult {
  pairs: {
    id: string
    name: string
    dayData: { volumeUSD: string }[]
    reserveUSD: string
  }[]
}

export interface LiquidityPositionsQueryResult {
  user: {
    liquidityPositions: {
      liquidityTokenBalance: string
      pair: {
        id: string
      }
    }[]
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

export enum ModalOperation {
  Stake = 'stake',
  Unstake = 'unstake',
}