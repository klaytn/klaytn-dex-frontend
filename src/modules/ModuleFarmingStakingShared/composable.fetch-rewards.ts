import { Kaikas, Address, asWei } from '@/core/kaikas'
import { useTask, wheneverTaskSucceeds } from '@vue-kakuyaku/core'
import { MULTICALL } from '@/core/kaikas/smartcontracts/abi'
import { Multicall } from '@/types/typechain/farming/MultiCall.sol'
import { Ref } from 'vue'
import { MULTICALL_CONTRACT_ADDRESS, REFETCH_REWARDS_INTERVAL } from './const'
import { PoolId, Rewards } from './types'
import invariant from 'tiny-invariant'

export interface GenericFetchRewardsProps<T extends PoolId | Address> {
  kaikas: Kaikas
  poolIds: Ref<T[] | null>
  updateBlockNumber: (value: number) => void
  prepareCalls: (ids: T[]) => [string, string][]
}

export function useFetchRewards<T extends PoolId | Address>({
  kaikas,
  poolIds,
  updateBlockNumber,
  prepareCalls,
}: GenericFetchRewardsProps<T>): {
  /**
   * reactive object
   */
  rewards: Rewards<T>
  areRewardsFetched: Ref<boolean>
} {
  const MulticallContract = kaikas.cfg.createContract<Multicall>(MULTICALL_CONTRACT_ADDRESS, MULTICALL)

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const rewards = reactive<Rewards<T>>({} as Rewards<T>)

  const fetchedRewards = computed<Set<T>>(() => {
    return new Set(Object.keys(rewards) as T[])
  })
  const rewardsToFetch = computed<Set<T>>(() => {
    return new Set((poolIds.value ?? []).filter((addr) => !fetchedRewards.value.has(addr)))
  })
  const areRewardsFetched = computed<boolean>(() => !rewardsToFetch.value.size)

  let fetchAll = false

  const fetchRewardsTask = useTask(async () => {
    let ids: T[]
    if (fetchAll) {
      invariant(poolIds.value)
      ids = poolIds.value
      fetchAll = false
    } else {
      ids = [...rewardsToFetch.value]
    }

    const calls = prepareCalls(ids)
    const result = await MulticallContract.methods.aggregate(calls).call()

    const rewards = result.returnData.reduce<Rewards<T>>(
      (acc, hexString, index) => {
        const poolId = ids[index]
        acc[poolId] = asWei(kaikas.cfg.caver.klay.abi.decodeParameter('uint256', hexString))
        return acc
      },
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      {} as Rewards<T>,
    )

    return {
      rewards,
      blockNumber: Number(result.blockNumber),
    }
  })

  useTaskLog(fetchRewardsTask, 'fetch-rewards-generic')

  wheneverTaskSucceeds(fetchRewardsTask, (result) => {
    updateBlockNumber(result.blockNumber)
    Object.assign(rewards, result.rewards)
  })

  function fetchRewards(all = false) {
    if (all) {
      fetchAll = true
    } else {
      if (!rewardsToFetch.value.size) return
    }
    fetchRewardsTask.run()
  }
  const fetchRewardsThrottled = useThrottleFn(fetchRewards, REFETCH_REWARDS_INTERVAL)

  const { resume } = useIntervalFn(() => fetchRewardsThrottled(true), REFETCH_REWARDS_INTERVAL, {
    immediate: false,
  })
  whenever(
    () => rewardsToFetch.value.size > 0,
    () => {
      fetchRewardsThrottled()
      resume()
    },
  )

  return { rewards, areRewardsFetched }
}
