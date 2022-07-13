import { Address } from '@/core/kaikas'
import { useLazyQuery } from '@vue/apollo-composable'
import { MaybeRef } from '@vueuse/core'
import gql from 'graphql-tag'
import { REFETCH_FARMING_INTERVAL } from './const'

export interface PairsQueryResult {
  pairs: {
    id: Address
    name: string
    reserveUSD: string
    totalSupply: string
  }[]
}

export function usePairsQuery(pairIds: MaybeRef<Address[]>) {
  return useLazyQuery<PairsQueryResult>(
    gql`
      query PairsQuery($pairIds: [String]!) {
        pairs(where: { id_in: $pairIds }) {
          id
          name
          reserveUSD
          totalSupply
        }
      }
    `,
    () => ({ pairIds: unref(pairIds) }),
    {
      clientId: 'exchange',
      pollInterval: REFETCH_FARMING_INTERVAL,
    },
  )
}
