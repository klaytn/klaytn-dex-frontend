import { Address } from '@/core'
import { ProposalQueryResult } from './query.proposal'

export const Sorting = {
  StartDay: 'startDay',
  EndDay: 'endDay',
} as const

export type Sorting = typeof Sorting[keyof typeof Sorting]

export const ProposalState = {
  Active: 'active',
  Closed: 'closed',
} as const

export type ProposalState = typeof ProposalState[keyof typeof ProposalState]

export const ProposalStatus = {
  Active: 'active',
  Executed: 'executed',
  Defeated: 'defeated',
  Finished: 'finished',
} as const

export type ProposalStatus = typeof ProposalStatus[keyof typeof ProposalStatus]

export type RawProposal = ProposalQueryResult['proposal']

export interface ListProposal {
  id: string
  title: string
  start: number
  end: number
  status: ProposalStatus
}

export interface Proposal {
  id: string
  title: string
  start: number
  end: number
  status: ProposalStatus
  choices: string[]
  scores: number[]
  scoresTotal: number
  body: string
  author: Address
  snapshot: number
}
