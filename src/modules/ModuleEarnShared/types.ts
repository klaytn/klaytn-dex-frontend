import { Address, Wei } from '@/core/kaikas'
import { Opaque } from 'type-fest'

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
