export { MAX_UINT256 } from '@/core'

export const FORMATTED_BIG_INT_DECIMALS = 6

/** Defines the update interval of the pool list and rewards in milliseconds */
export const POLL_INTERVAL = 10_000
export const POLL_INTERVAL_QUICK = 1_000
export const POLL_INTERVAL_QUICK_TIMEOUT = 5_000

/** Defines the update interval of rewards in milliseconds */
export const REFETCH_REWARDS_INTERVAL = 10_000

/** Defines the update interval of tokens in milliseconds */
export const REFETCH_TOKENS_INTERVAL = 10_000

export const PAGE_SIZE = 10

export const BLOCK_TIME_IN_SECONDS = 60
export const BLOCKS_PER_YEAR = (60 / BLOCK_TIME_IN_SECONDS) * 60 * 24 * 365
