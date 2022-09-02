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
