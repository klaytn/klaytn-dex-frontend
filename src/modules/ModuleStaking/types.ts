import { Address, CurrencySymbol, WeiAsToken } from '@/core'
import BigNumber from 'bignumber.js'
import { AmountInUSD, PercentageRate, TokenPriceInUSD } from '../ModuleEarnShared/types'
export * from '../ModuleEarnShared/types'

export interface Pool {
  id: Address
  stakeToken: {
    id: Address
    decimals: number
    symbol: CurrencySymbol
    name: string
  }
  rewardToken: {
    id: Address
    decimals: number
    symbol: CurrencySymbol
    name: string
  }
  staked: WeiAsToken<BigNumber>
  earned: WeiAsToken<BigNumber> | null
  stakeTokenPrice: TokenPriceInUSD | null
  createdAtBlock: number
  totalStaked: AmountInUSD
  annualPercentageRate: PercentageRate | null
  startBlock: number
  endBlock: number
  active: boolean
  userLimit: WeiAsToken<BigNumber> | null
  userLimitEndBlock: number
}

export const Sorting = {
  Hot: 'hot',
  AnnualPercentageRate: 'annualPercentageRate',
  Earned: 'earned',
  TotalStaked: 'totalStaked',
  Latest: 'latest',
} as const

export type Sorting = typeof Sorting[keyof typeof Sorting]
