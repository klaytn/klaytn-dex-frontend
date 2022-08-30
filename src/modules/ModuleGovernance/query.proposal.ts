import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { Ref } from 'vue'
import { Address } from '@/core'
import { ProposalState } from './types'
import { ApolloClientId } from '@/types'

export interface ProposalQueryResult {
  proposal: {
    id: string
    title: string
    start: number
    end: number
    state: ProposalState
    choices: string[]
    scores: number[]
    scores_total: number
    body: string
    author: Address
    snapshot: number
  }
}

export function useProposalQuery(id: Ref<string>) {
  return useQuery<ProposalQueryResult>(
    gql`
      query ProposalQuery($id: String!) {
        proposal(id: $id) {
          id
          title
          start
          end
          state
          choices
          scores
          scores_total
          body
          author
          snapshot
        }
      }
    `,
    () => ({
      id: id.value,
    }),
    {
      clientId: ApolloClientId.Snapshot,
    },
  )
}
