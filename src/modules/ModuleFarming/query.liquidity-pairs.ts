import { Address } from '@/core/kaikas'
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

export function useLiquidityPairsQuery(userId: MaybeRef<Address>) {
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
    { clientId: 'exchange' },
  )
}
