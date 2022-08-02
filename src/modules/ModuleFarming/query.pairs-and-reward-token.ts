import { Address } from '@/core/kaikas'
import { useLazyQuery } from '@vue/apollo-composable'
import { MaybeRef } from '@vueuse/core'
import gql from 'graphql-tag'
import { REFETCH_FARMING_INTERVAL, REWARD_TOKEN_ADDRESS } from './const'

export interface PairsAndRewardTokenQueryResult {
  pairs: {
    id: Address
    name: string
    reserveUSD: string
    totalSupply: string
    dayData: {
      volumeUSD: string
    }[]
  }[],
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
        token(id: "${REWARD_TOKEN_ADDRESS}") {
          derivedUSD
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
