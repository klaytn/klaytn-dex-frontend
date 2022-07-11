import { Address } from '@/types'
import BigNumber from 'bignumber.js'

export interface PoolsQueryResult {
  pools: {
    id: string
    stakeToken: {
      id: string
      decimals: string
      symbol: string
      name: string
    }
    rewardToken: {
      id: string
      decimals: string
      symbol: string
      name: string
    }
    createdAtBlock: string
    totalTokensStaked: string
    lastRewardBlock: string
    users: {
      amount: string
    }[]
  }[]
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
  stakeToken: {
    id: string
    decimals: number
    symbol: string
    name: string
  }
  rewardToken: {
    id: string
    decimals: number
    symbol: string
    name: string
  }
  staked: BigNumber
  earned: BigNumber
  createdAtBlock: number
  totalStaked: BigNumber
  annualPercentageRate: BigNumber
  endsIn: number
}

export type Rewards = Record<Pool['id'], string | undefined>

export enum ModalOperation {
  Stake = 'stake',
  Unstake = 'unstake',
}

export enum Sorting {
  Default = 'default',
  AnnualPercentageRate = 'annualPercentageRate',
  Earned = 'earned',
  TotalStaked = 'totalStaked',
  Latest = 'latest'
}