import { Address } from '@/core'
import { ApolloClientId } from '@/types'
import { useLazyQuery } from '@vue/apollo-composable'
import { MaybeRef } from '@vueuse/core'
import gql from 'graphql-tag'

export type Tokens = {
  id: Address
  derivedUSD: string
}[]

export interface TokensQueryResult {
  tokens: Tokens
}

export function useTokensQuery(
  tokenIds: MaybeRef<Address[]>,
  options: {
    pollInterval: number
  },
) {
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
      tokenIds: unref(tokenIds).map((x) => x.toLowerCase()),
    }),
    {
      clientId: ApolloClientId.Exchange,
      pollInterval: options.pollInterval,
    },
  )
}
