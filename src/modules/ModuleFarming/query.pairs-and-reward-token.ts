import { Address, DEX_TOKEN } from '@/core'
import { ApolloClientId } from '@/types'
import { useLazyQuery } from '@vue/apollo-composable'
import { MaybeRef } from '@vueuse/core'
import gql from 'graphql-tag'
import { POLL_INTERVAL } from './const'

export interface PairsAndRewardTokenQueryResult {
  pairs: {
    id: Address
    name: string
    reserveUSD: string
    totalSupply: string
    dayData: {
      volumeUSD: string
    }[]
  }[]
  token: {
    derivedUSD: string
  }
}

export function usePairsAndRewardTokenQuery(pairIds: MaybeRef<Address[]>) {
  return useLazyQuery<PairsAndRewardTokenQueryResult>(
    gql`
      query PairsAndRewardTokenQuery($pairIds: [String]!) {
        pairs(where: { id_in: $pairIds }) {
          id
          name
          reserveUSD
          totalSupply
          dayData(first: 1) {
            volumeUSD
          }
        },
        token(id: "${DEX_TOKEN}") {
          derivedUSD
        }
      }
    `,
    () => ({ pairIds: unref(pairIds) }),
    {
      clientId: ApolloClientId.Exchange,
      pollInterval: POLL_INTERVAL,
    },
  )
}
