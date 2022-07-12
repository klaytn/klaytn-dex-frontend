import { FARMING } from '@/core/kaikas/smartcontracts/abi'
import invariant from 'tiny-invariant'
import { Except } from 'type-fest'
import { GenericFetchRewardsProps, useFetchRewards } from '../ModuleFarmingStakingShared/composable.fetch-rewards'
import { FARMING_CONTRACT_ADDRESS } from './const'
import { PoolId } from './types'

export function useFetchFarmingRewards(props: Except<GenericFetchRewardsProps<PoolId>, 'prepareCalls'>) {
  /**
   * FIXME describe magic constant
   */
  const PENDING_PTN_ABI_NAME = 'pendingPtn' as const
  const abiItem = FARMING.find((item) => item.name === PENDING_PTN_ABI_NAME)
  invariant(abiItem)

  return useFetchRewards({
    ...props,
    prepareCalls: (ids) => {
      return ids.map((poolId) => {
        return [
          FARMING_CONTRACT_ADDRESS,
          props.kaikas.cfg.caver.klay.abi.encodeFunctionCall(abiItem, [poolId, props.kaikas.selfAddress]),
        ]
      })
    },
  })
}
