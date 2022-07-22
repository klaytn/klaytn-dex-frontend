import { Address } from '@/core/kaikas'

export const Sorting = {
  StartDay: 'startDay',
  EndDay: 'endDay',
} as const

export type Sorting = typeof Sorting[keyof typeof Sorting]

export const ProposalState = {
  Active: 'active',
  Executed: 'executed',
  Defeated: 'defeated',
  Finished: 'finished'
} as const

export type ProposalState = typeof ProposalState[keyof typeof ProposalState]

export interface ListProposal {
  id: Address
  title: string
  start: number
  end: number
  state: ProposalState
}

export interface Proposal {
  id: Address
  title: string
  start: number
  end: number
  state: ProposalState
  choices: string[]
  scores: number[],
  body: string
}
