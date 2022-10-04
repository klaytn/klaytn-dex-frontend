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
