import { Except } from 'type-fest'
import { GenericFetchRewardsProps, useFetchRewards } from '../ModuleEarnShared/composable.fetch-rewards'
import { PoolId } from './types'

export function useFetchFarmingRewards(props: Except<GenericFetchRewardsProps<PoolId>, 'fetchFn'>) {
  const dexStore = useDexStore()

  return useFetchRewards({
    ...props,
    fetchFn: (pools) => dexStore.getNamedDexAnyway().earn.farming.getRewards(pools),
  })
}
