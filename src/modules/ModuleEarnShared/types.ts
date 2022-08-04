import BigNumber from 'bignumber.js'
import { Opaque } from 'type-fest'
import { Address, Wei } from '@/core/kaikas'

/**
 * Stringified number
 */
export type PoolId = Opaque<string, 'PoolId'>

export type Rewards<T extends Address | PoolId> = Record<T, Wei | undefined>

export const ModalOperation = {
  Stake: 'stake',
  Unstake: 'unstake',
} as const

export type ModalOperation = typeof ModalOperation[keyof typeof ModalOperation]

export const Period = {
  d1: '1D',
  d7: '7D',
  d14: '14D',
  d30: '30D',
  y1: '1Y',
  y5: '5Y',
} as const

export type Period = typeof Period[keyof typeof Period]

export const StakeTabs = {
  d1: Period.d1,
  d7: Period.d7,
  d30: Period.d30,
  y1: Period.y1,
  y5: Period.y5,
} as const

export type StakeTabs = typeof StakeTabs[keyof typeof StakeTabs]

export const CompoundingTabs = {
  d1: Period.d1,
  d7: Period.d7,
  d14: Period.d14,
  d30: Period.d30,
} as const

export type CompoundingTabs = typeof CompoundingTabs[keyof typeof CompoundingTabs]

export const StakeUnits = {
  tokens: 'tokens',
  USD: 'USD',
} as const

export type StakeUnits = typeof StakeUnits[keyof typeof StakeUnits]

/**
 * It is a price of one WeiAsToken in USD.
 */
export type TokenPriceInUSD<T extends BigNumber | string = BigNumber> = Opaque<T, 'TokenValue'>

/**
 * It is a price of some amount of WeiAsToken in USD.
 */
export type AmountInUSD<T extends BigNumber | string = BigNumber> = Opaque<T, 'TokenValue'>

/**
 * It is a percentage rate of something (APR or APY for example): [0 - 100]
 */
export type PercentageRate<T extends BigNumber | string = BigNumber> = Opaque<T, 'TokenValue'>
