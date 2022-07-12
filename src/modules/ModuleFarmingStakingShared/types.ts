import { Address, ValueWei } from '@/core/kaikas'

export type Rewards = Record<Address, ValueWei<string> | undefined>

export const ModalOperation = {
  Stake: 'stake',
  Unstake: 'unstake',
} as const

export type ModalOperation = typeof ModalOperation[keyof typeof ModalOperation]
