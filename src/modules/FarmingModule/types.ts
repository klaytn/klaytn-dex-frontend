import { Address } from '@/types'
import BigNumber from 'bignumber.js'

export interface FarmingsQueryResult {
  farming: {
    id: string
    poolCount: number
    totalAllocPoint: string
    pools: {
      id: string
      pair: string
      bonusMultiplier: string
      totalTokensStaked: string
      allocPoint: string
      users: {
        amount: string
      }[]
    }[]
  }
}

export interface PairsQueryResult {
  pairs: {
    id: string
    name: string
    reserveUSD: string
    totalSupply: string
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
  multiplier: BigNumber
}

export enum ModalOperation {
  Stake = 'stake',
  Unstake = 'unstake',
}