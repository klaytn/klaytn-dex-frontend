import { Address } from '@/core/kaikas'
import BigNumber from 'bignumber.js'

export const MAX_UINT256 = new BigNumber(2).pow(256).minus(1)

export const FORMATTED_BIG_INT_DECIMALS = 6

/** Defines the update interval of the pool list in milliseconds */
export const REFETCH_FARMING_INTERVAL = 10_000

/** Defines the update interval of rewards in milliseconds */
export const REFETCH_REWARDS_INTERVAL = 1_000

export const PAGE_SIZE = 10

export const FARMING_CONTRACT_ADDRESS = '0x32bE07FB9dBf294c2e92715F562f7aBA02b7443A' as Address
export const MULTICALL_CONTRACT_ADDRESS = '0xc88098CEaE07D1FE443372a0accC464A5fb94668' as Address
