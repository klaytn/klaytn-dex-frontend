import { Address } from '@/core/kaikas'

import { Period } from './types'

export const MAX_UINT256 = 2n ** 256n - 1n

export const FORMATTED_BIG_INT_DECIMALS = 6

/** Defines the update interval of the pool list in milliseconds */
export const REFETCH_FARMING_INTERVAL = 10_000

/** Defines the update interval of rewards in milliseconds */
export const REFETCH_REWARDS_INTERVAL = 10_000

/** Defines the update interval of tokens in milliseconds */
export const REFETCH_TOKENS_INTERVAL = 10_000

export const PAGE_SIZE = 10

export const BLOCK_TIME_IN_SECONDS = 60
export const BLOCKS_PER_YEAR = (60 / BLOCK_TIME_IN_SECONDS) * 60 * 24 * 365

export const MULTICALL_CONTRACT_ADDRESS = '0xc88098CEaE07D1FE443372a0accC464A5fb94668' as Address

export const periodDays = {
  [Period.d1]: 1,
  [Period.d7]: 7,
  [Period.d14]: 14,
  [Period.d30]: 30,
  [Period.y1]: 365,
  [Period.y5]: 365 * 5
}

