import { Address, Wei, defaultAbiCoder } from '@/core'
import invariant from 'tiny-invariant'
import { Ref } from 'vue'
import { REFETCH_REWARDS_INTERVAL } from './const'
import { PoolId, Rewards } from './types'
import { CallStruct } from '@/core/domain/earn'
import { PromiseOrValue } from '@/core/typechain-ethers/common'

export interface GenericFetchRewardsProps<T extends PoolId | Address> {
  poolIds: Ref<T[] | null>
  updateBlockNumber: (value: number) => void
  prepareCalls: (ids: T[]) => PromiseOrValue<CallStruct[]>
}

export function useFetchRewards<T extends PoolId | Address>({
  poolIds,
  updateBlockNumber,
  prepareCalls,
}: GenericFetchRewardsProps<T>): {
  rewards: Ref<null | Rewards<T>>
  areRewardsFetched: Ref<boolean>
} {
  const dexStore = useDexStore()

  async function fetchRewards(ids: T[]): Promise<FetchRewardsResult> {
    const calls = await prepareCalls(ids)
    const dex = dexStore.anyDex.dex()
    const aggrResult = await dex.earn.multicallAggregate(calls)

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const rewards = {} as Rewards<T>
    aggrResult.returnData.forEach((hex, idx) => {
      const [decoded] = defaultAbiCoder.decode(['uint256'], hex)
      rewards[ids[idx]] = new Wei(decoded)
    })

    return {
      rewards,
      blockNumber: Number(aggrResult.blockNumber),
    }
  }

  interface FetchRewardsResult {
    rewards: Rewards<T>
    blockNumber: number
  }

  const { state, set } = usePromise<FetchRewardsResult>() // use promise state

  function run() {
    const ids = poolIds.value
    invariant(ids)
    if (!state.pending) {
      set(fetchRewards(ids)) // set promise
    }
  }
  const runDebounced = useDebounceFn(run, REFETCH_REWARDS_INTERVAL)

  watch(poolIds, (val) => val && run(), { immediate: true })
  wheneverDone(state, (result) => {
    runDebounced()
    if (result.fulfilled) {
      updateBlockNumber(result.fulfilled.value.blockNumber)
    }
  })
  usePromiseLog(state, 'fetch-rewards-generic')

  const fulfilled = toRef(useStaleState(state), 'fulfilled') // getting stale rewards data

  const rewards = computed(() => fulfilled.value?.value?.rewards ?? null)
  const areRewardsFetched = computed(() => !!rewards.value)

  return { rewards, areRewardsFetched }
}
