import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { Ref } from 'vue'
import { Address } from '@/core'
import { PAGE_SIZE } from './const'
import { ApolloClientId } from '@/types'

export interface VotesQueryResult {
  votes: {
    id: string
    voter: Address
    choice: number
    vp: number
  }[]
}

export function useVotesQuery(props: Ref<{ skip: number; proposalId: string }>) {
  return useQuery<VotesQueryResult>(
    gql`
      query VotesQuery($skip: Int!, $proposal: String!) {
        votes(
          first: ${PAGE_SIZE},
          skip: $skip,
          where: {
            proposal: $proposal,
          },
          orderBy: "vp"
        ) {
          id
          voter
          choice
          vp
        }
      }
    `,
    () => ({
      skip: props.value.skip,
      proposal: props.value.proposalId,
    }),
    {
      clientId: ApolloClientId.Snapshot,
    },
  )
}
