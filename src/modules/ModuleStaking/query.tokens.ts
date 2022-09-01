import { Address } from '@/core'
import { ApolloClientId } from '@/types'
import { useLazyQuery } from '@vue/apollo-composable'
import { MaybeRef } from '@vueuse/core'
import gql from 'graphql-tag'
import { REFETCH_TOKENS_INTERVAL } from './const'

export interface TokensQueryResult {
  tokens: {
    id: Address
    derivedUSD: string
  }[]
}

export function useTokensQuery(tokenIds: MaybeRef<Address[]>) {
  return useLazyQuery<TokensQueryResult>(
    gql`
      query TokensQuery($tokenIds: [String]!) {
        tokens(where: { id_in: $tokenIds }) {
          id
          derivedUSD
        }
      }
    `,
    () => ({
      tokenIds: unref(tokenIds),
    }),
    {
      clientId: ApolloClientId.Exchange,
      pollInterval: REFETCH_TOKENS_INTERVAL,
    },
  )
}
