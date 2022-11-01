import { type Address } from '@/core'
import invariant from 'tiny-invariant'
import { type Ref } from 'vue'
import { REFETCH_REWARDS_INTERVAL } from './const'
import type { PoolId, Rewards } from './types'
import type { RewardsWithBlockNumber } from '@/core/domain/earn'
import { MaybeRef } from '@vueuse/core'

export interface GenericFetchRewardsProps<K extends PoolId | Address> {
  poolIds: Ref<K[] | null>
  fetchFn: (pools: K[]) => Promise<RewardsWithBlockNumber<K>>
  updateBlockNumber: (value: number) => void
  pollInterval?: Ref<number>
}

export function useFetchRewards<K extends PoolId | Address>({
  poolIds,
  updateBlockNumber,
  fetchFn,
  pollInterval,
}: GenericFetchRewardsProps<K>): {
  rewards: Ref<null | Rewards<K>>
  areRewardsFetched: MaybeRef<boolean>
} {
  const dexStore = useDexStore()
  const { state, set } = usePromise<RewardsWithBlockNumber<K>>() // use promise state

  function run() {
    if (!dexStore.isWalletConnected) return
    const ids = poolIds.value
    invariant(ids)
    if (!state.pending) {
      set(fetchFn(ids)) // set promise
    }
  }
  const runDebounced = useDebounceFn(
    run,
    computed(() => unref(pollInterval) || REFETCH_REWARDS_INTERVAL),
  )

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
