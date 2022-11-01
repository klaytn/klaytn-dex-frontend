import { Address, CurrencySymbol, WeiAsToken } from '@/core'
import { ApolloClientId } from '@/types'
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { REFETCH_PAIRS_INTERVAL } from './const'

export interface PairsQueryResult {
  pairs: {
    id: Address
    token0: {
      id: Address
      decimals: string
      symbol: CurrencySymbol
      name: string
    }
    token1: {
      id: Address
      decimals: string
      symbol: CurrencySymbol
      name: string
    }
    reserve0: WeiAsToken
    reserve1: WeiAsToken
  }[]
}

export function usePairsQuery() {
  return useQuery<PairsQueryResult>(
    gql`
      query PairsQuery {
        pairs {
          id
          reserve1
          reserve0
          token0 {
            id
            decimals
            symbol
            name
          }
          token1 {
            id
            decimals
            symbol
            name
          }
        }
      }
    `,
    {},
    {
      clientId: ApolloClientId.Exchange,
      pollInterval: REFETCH_PAIRS_INTERVAL,
    },
  )
}
