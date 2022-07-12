import { Except } from 'type-fest'
import { GenericFetchRewardsProps, useFetchRewards } from '../ModuleEarnShared/composable.fetch-rewards'
import { STAKING } from '@/core/kaikas/smartcontracts/abi'
import invariant from 'tiny-invariant'
import { Address } from '@/core/kaikas'

export function useFetchStakingRewards(props: Except<GenericFetchRewardsProps<Address>, 'prepareCalls'>) {
  const abiItem = STAKING.find((item) => item.name === 'pendingReward')
  invariant(abiItem)

  return useFetchRewards({
    ...props,
    prepareCalls: (ids) => {
      return ids.map((poolId) => {
        return [poolId, props.kaikas.cfg.caver.klay.abi.encodeFunctionCall(abiItem, [props.kaikas.selfAddress])]
      })
    },
  })
}
