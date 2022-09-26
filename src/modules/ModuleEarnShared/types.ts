import BigNumber from 'bignumber.js'
import type { Opaque } from 'type-fest'
import type { PoolId } from '@/core'
import type { Rewards } from '@/core/domain/earn'

export { PoolId, Rewards }

export const ModalOperation = {
  Stake: 'stake',
  Unstake: 'unstake',
} as const

export type ModalOperation = typeof ModalOperation[keyof typeof ModalOperation]

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
