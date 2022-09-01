import { Address } from '@/core'
import { ApolloClientId } from '@/types'
import { useQuery } from '@vue/apollo-composable'
import { MaybeRef } from '@vueuse/core'
import gql from 'graphql-tag'

export interface LiquidityPositionsQueryResult {
  user: {
    liquidityPositions: {
      liquidityTokenBalance: string
      pair: {
        id: Address
      }
    }[]
  }
}

export function useLiquidityPositionsQuery(userId: MaybeRef<Address | null>) {
  return useQuery<LiquidityPositionsQueryResult>(
    gql`
      query LiquidityPositionsQuery($userId: String!) {
        user(id: $userId) {
          liquidityPositions {
            liquidityTokenBalance
            pair {
              id
            }
          }
        }
      }
    `,
    () => ({
      userId: unref(userId),
    }),
    () => ({ clientId: ApolloClientId.Exchange, enabled: !!unref(userId) }),
  )
}
