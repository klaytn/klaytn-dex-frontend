import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { Ref } from 'vue'
import { Address } from '@/core/kaikas'

export interface ProposalQueryResult {
  proposal: {
    id: Address
    title: string
    start: number
    end: number
    state: 'active' | 'closed'
    choices: string[]
    scores: number[],
    body: string
  }
}

export function useProposalQuery(id: Ref<Address>) {
  return useQuery<ProposalQueryResult>(
    gql`
      query ProposalQuery($id: String!) {
        proposal(
          id: $id
        ) {
          id
          title
          start
          end
          state
          choices
          scores
          body
        }
      }
    `,
    () => ({
      id: id.value
    }),
    {
      clientId: 'snapshot',
    },
  )
}
