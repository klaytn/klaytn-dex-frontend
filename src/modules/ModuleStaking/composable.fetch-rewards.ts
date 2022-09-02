import type { Except } from 'type-fest'
import { type GenericFetchRewardsProps, useFetchRewards } from '../ModuleEarnShared/composable.fetch-rewards'
import type { Address } from '@/core'

export function useFetchStakingRewards(props: Except<GenericFetchRewardsProps<Address>, 'fetchFn'>) {
  const dexStore = useDexStore()

  return useFetchRewards({
    ...props,
    fetchFn: (pools) => dexStore.getNamedDexAnyway().earn.staking.getRewards(pools),
  })
}
