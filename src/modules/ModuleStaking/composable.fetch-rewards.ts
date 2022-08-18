import { Except } from 'type-fest'
import { GenericFetchRewardsProps, useFetchRewards } from '../ModuleEarnShared/composable.fetch-rewards'
import { AbiLoader, Address } from '@/core'
import { Interface, JsonFragment } from '@ethersproject/abi'

async function getEncoder(abi: AbiLoader): Promise<(address: Address) => string> {
  const fragments = abi.get('staking') || (await abi.load('staking'))
  const iface = new Interface(fragments as JsonFragment[])
  return (addr) =>
    // FIXME please describe why we use `pendingReward` here
    iface.encodeFunctionData('pendingReward', [addr])
}

export function useFetchStakingRewards(props: Except<GenericFetchRewardsProps<Address>, 'prepareCalls'>) {
  const dexStore = useDexStore()
  const encoderPromise = getEncoder(dexStore.abi())

  return useFetchRewards({
    ...props,
    prepareCalls: async (ids) => {
      const encode = await encoderPromise
      const dex = dexStore.getNamedDexAnyway()

      return ids.map((poolId) => ({
        target: poolId,
        callData: encode(dex.agent.address),
      }))
    },
  })
}
