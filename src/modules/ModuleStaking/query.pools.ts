import { Address, Token, WeiRaw } from '@/core'
import { ApolloClientId } from '@/types'
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { Except } from 'type-fest'
import { Ref } from 'vue'

type ApolloToken = Except<Token, 'address'> & { id: Address }

export interface PoolsQueryResult {
  pools: {
    id: Address
    stakeToken: ApolloToken
    rewardToken: ApolloToken
    rewardRate: string
    createdAtBlock: string
    totalTokensStaked: WeiRaw<string>
    startBlock: string
    endBlock: string
    blocksForUserLimit: string
    userLimit: WeiRaw<string>
    users: [
      {
        amount: WeiRaw<string>
      }?,
    ]
  }[]
}

export function usePoolsQuery(userId: Ref<Address | null>, pollInterval: Ref<number>) {
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
          rewardRate
          createdAtBlock
          totalTokensStaked
          startBlock
          endBlock
          blocksForUserLimit
          userLimit
          users(where: { address: $userId }) {
            amount
          }
        }
      }
    `,
    () => ({
      userId: unref(userId) ?? '',
    }),
    () => ({
      clientId: ApolloClientId.Staking,
      pollInterval: pollInterval.value,
    }),
  )
}
