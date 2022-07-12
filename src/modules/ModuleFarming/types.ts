import { Address } from '@/core/kaikas'
import BigNumber from 'bignumber.js'

export interface FarmingQueryResult {
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
      bonusEndBlock: string
      createdAtBlock: string
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
  createdAtBlock: number
}

export type Rewards = Record<Address, string | undefined>

export const ModalOperation = {
  Stake: 'stake',
  Unstake: 'unstake',
} as const

export type ModalOperation = typeof ModalOperation[keyof typeof ModalOperation]

export const Sorting = {
  Default: 'default',
  Liquidity: 'liquidity',
  AnnualPercentageRate: 'annualPercentageRate',
  Multiplier: 'multiplier',
  Earned: 'earned',
  Latest: 'latest',
} as const

export type Sorting = typeof Sorting[keyof typeof Sorting]
