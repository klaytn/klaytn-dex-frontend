import { Address, ADDRESS_FARMING, WeiRaw } from '@/core'
import { useQuery } from '@vue/apollo-composable'
import { MaybeRef } from '@vueuse/core'
import gql from 'graphql-tag'
import { REFETCH_FARMING_INTERVAL } from './const'
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

export function useFarmingQuery(userId: MaybeRef<Address | null>) {
  return useQuery<FarmingQueryResult>(
    gql`
        query FarmingQuery($userId: String!) {
          farming(id: "${ADDRESS_FARMING}") {
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
    () => ({
      clientId: 'farming',
      enabled: !!unref(userId),
      pollInterval: REFETCH_FARMING_INTERVAL,
    }),
  )
}
