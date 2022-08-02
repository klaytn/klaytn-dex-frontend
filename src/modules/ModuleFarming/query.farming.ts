import { Address, WeiRaw } from '@/core/kaikas'
import { useQuery } from '@vue/apollo-composable'
import { MaybeRef } from '@vueuse/core'
import gql from 'graphql-tag'
import { FARMING_CONTRACT_ADDRESS, REFETCH_FARMING_INTERVAL } from './const'
import { PoolId } from './types'

export interface FarmingQueryResult {
  farming: {
    id: Address
    poolCount: number
    totalAllocPoint: string
    rewardRate: string
    pools: {
      id: PoolId
      pair: Address
      bonusMultiplier: string
      totalTokensStaked: WeiRaw<string>
      allocPoint: string
      bonusEndBlock: string
      createdAtBlock: string
      users: {
        amount: WeiRaw<string>
      }[]
    }[]
  }
}

export function useFarmingQuery(userId: MaybeRef<Address>) {
  return useQuery<FarmingQueryResult>(
    gql`
        query FarmingQuery($userId: String!) {
          farming(id: "${FARMING_CONTRACT_ADDRESS}") {
            id
            poolCount
            totalAllocPoint
            rewardRate
            pools {
              id
              pair
              bonusMultiplier
              totalTokensStaked
              allocPoint
              bonusEndBlock
              createdAtBlock
              users(where: {address: $userId}) {
                amount
              }
            }
          }
        }
      `,
    () => ({
      userId: unref(userId),
    }),
    {
      clientId: 'farming',
      pollInterval: REFETCH_FARMING_INTERVAL,
    },
  )
}
