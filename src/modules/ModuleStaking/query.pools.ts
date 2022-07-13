import { Address, TokenSymbol } from '@/core/kaikas'
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { Ref } from 'vue'
import { REFETCH_POOLS_INTERVAL } from './const'

export interface PoolsQueryResult {
  pools: {
    id: Address
    stakeToken: {
      id: Address
      decimals: string
      symbol: TokenSymbol
      name: string
    }
    rewardToken: {
      id: Address
      decimals: string
      symbol: TokenSymbol
      name: string
    }
    createdAtBlock: string
    totalTokensStaked: string
    endBlock: string
    users: {
      amount: string
    }[]
  }[]
}

export function usePoolsQuery(userId: Ref<Address | null>) {
  return useQuery<PoolsQueryResult>(
    gql`
      query PoolsQuery($userId: String!) {
        pools {
          id
          stakeToken {
            id
            decimals
            symbol
            name
          }
          rewardToken {
            id
            decimals
            symbol
            name
          }
          createdAtBlock
          totalTokensStaked
          endBlock
          users(where: { address: $userId }) {
            amount
          }
        }
      }
    `,
    () => ({
      userId: userId.value,
    }),
    {
      clientId: 'staking',
      pollInterval: REFETCH_POOLS_INTERVAL,
    },
  )
}
