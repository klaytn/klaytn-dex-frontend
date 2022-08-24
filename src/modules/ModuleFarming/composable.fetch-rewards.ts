import { Except } from 'type-fest'
import { GenericFetchRewardsProps, useFetchRewards } from '../ModuleEarnShared/composable.fetch-rewards'
import { PoolId } from './types'
import { AbiLoader, Address, ADDRESS_FARMING } from '@/core'
import { Interface, JsonFragment } from '@ethersproject/abi'

async function getEncoder(abi: AbiLoader): Promise<(poolId: PoolId, address: Address) => string> {
  const fragments = abi.get('farming') || (await abi.load('farming'))
  const iface = new Interface(fragments as JsonFragment[])
  return (poolId, addr) =>
    // FIXME please describe why we use `pendingBtn` here
    iface.encodeFunctionData('pendingPtn', [poolId, addr])
}

export function useFetchFarmingRewards(props: Except<GenericFetchRewardsProps<PoolId>, 'prepareCalls'>) {
  const dexStore = useDexStore()
  const endoderPromise = getEncoder(useDexStore().abi())

  return useFetchRewards({
    ...props,
    prepareCalls: async (ids) => {
      const encode = await endoderPromise
      const dex = dexStore.getNamedDexAnyway()

      return ids.map((poolId) => ({
        target: ADDRESS_FARMING,
        callData: encode(poolId, dex.agent.address),
      }))
    },
  })
}
