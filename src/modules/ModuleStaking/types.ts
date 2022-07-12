import { Address, TokenSymbol } from '@/core/kaikas'
import BigNumber from 'bignumber.js'
export * from '../ModuleFarmingStakingShared/types'

export interface Pool {
  id: Address
  stakeToken: {
    id: Address
    decimals: number
    symbol: TokenSymbol
    name: string
  }
  rewardToken: {
    id: Address
    decimals: number
    symbol: TokenSymbol
    name: string
  }
  staked: BigNumber
  earned: BigNumber
  createdAtBlock: number
  totalStaked: BigNumber
  annualPercentageRate: BigNumber
  endsIn: number
}

export const Sorting = {
  Default: 'default',
  AnnualPercentageRate: 'annualPercentageRate',
  Earned: 'earned',
  TotalStaked: 'totalStaked',
  Latest: 'latest',
} as const

export type Sorting = typeof Sorting[keyof typeof Sorting]
