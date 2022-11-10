import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { Ref } from 'vue'
import { Address } from '@/core'
import { PAGE_SIZE } from './const'
import { ProposalState } from './types'
import { ApolloClientId } from '@/types'
import CONFIG from '~config'

export interface ProposalsQueryResult {
  proposals: {
    id: Address
    title: string
    start: number
    end: number
    state: ProposalState
    choices: string[]
    scores: number[]
  }[]
}

export function useProposalsQuery(props: Ref<{ onlyActive: boolean; skip: number; orderBy: string; query: string }>) {
  const state = computed(() => {
    return props.value.onlyActive ? 'active' : ''
  })

  return useQuery<ProposalsQueryResult>(
    gql`
      query ProposalsQuery($skip: Int!, $orderBy: String!, $query: String!, $state: String!) {
        proposals(
          first: ${PAGE_SIZE},
          skip: $skip,
          where: {
            space_in: ["${CONFIG.snapshotSpace}"],
            title_contains: $query,
            state: $state
          },
          orderBy: $orderBy,
          orderDirection: desc
        ) {
          id
          title
          start
          end
          state
          choices
          scores
        }
      }
    `,
    () => ({
      skip: props.value.skip,
      orderBy: props.value.orderBy,
      query: props.value.query,
      state: state.value,
    }),
    {
      clientId: ApolloClientId.Snapshot,
    },
  )
}
