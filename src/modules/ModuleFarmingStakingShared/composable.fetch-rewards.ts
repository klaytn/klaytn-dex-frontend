import { Kaikas, Address, asWei } from '@/core/kaikas'
import { Task, useDanglingScope, useTask, wheneverTaskSucceeds } from '@vue-kakuyaku/core'
import { MULTICALL } from '@/core/kaikas/smartcontracts/abi'
import { Multicall } from '@/types/typechain/farming/MultiCall.sol'
import { Ref } from 'vue'
import { MULTICALL_CONTRACT_ADDRESS, REFETCH_REWARDS_INTERVAL } from './const'
import { Rewards } from './types'

export interface GenericFetchRewardsProps {
  kaikas: Kaikas
  poolIds: Ref<Address[] | null>
  updateBlockNumber: (value: number) => void
  prepareCalls: (ids: Address[]) => [string, string][]
}

export function useFetchRewards({ kaikas, poolIds, updateBlockNumber, prepareCalls }: GenericFetchRewardsProps): {
  /**
   * reactive object
   */
  rewards: Rewards
  areRewardsFetched: Ref<boolean>
} {
  const MulticallContract = kaikas.cfg.createContract<Multicall>(MULTICALL_CONTRACT_ADDRESS, MULTICALL)

  const rewards = reactive<Rewards>({})

  const fetchedRewards = computed<Set<Address>>(() => {
    return new Set(Object.keys(rewards) as Address[])
  })
  const rewardsToFetch = computed<Set<Address>>(() => {
    return new Set((poolIds.value ?? []).filter((addr) => !fetchedRewards.value.has(addr)))
  })
  const areRewardsFetched = computed<boolean>(() => !rewardsToFetch.value.size)

  const fetchRewardsTaskScope = useDanglingScope<Task<{ blockNumber: number; rewards: Rewards }>>()

  function fetchRewards() {
    const ids = [...rewardsToFetch.value]
    if (!ids.length) return

    fetchRewardsTaskScope.setup(() => {
      const task = useTask(async () => {
        const calls = prepareCalls(ids)
        const result = await MulticallContract.methods.aggregate(calls).call()

        const rewards = result.returnData.reduce<Rewards>((acc, hexString, index) => {
          const poolId = ids[index]
          acc[poolId] = asWei(kaikas.cfg.caver.klay.abi.decodeParameter('uint256', hexString))
          return acc
        }, {})

        return {
          rewards,
          blockNumber: Number(result.blockNumber),
        }
      })

      task.run()

      wheneverTaskSucceeds(task, (result) => {
        updateBlockNumber(result.blockNumber)
        Object.assign(rewards, result.rewards)
      })

      return task
    })
  }

  const fetchRewardsThrottled = useThrottleFn(fetchRewards, REFETCH_REWARDS_INTERVAL)
  useIntervalFn(() => fetchRewardsThrottled(), REFETCH_REWARDS_INTERVAL)
  whenever(
    () => rewardsToFetch.value.size > 0,
    () => fetchRewardsThrottled(),
  )

  return { rewards, areRewardsFetched }
}
