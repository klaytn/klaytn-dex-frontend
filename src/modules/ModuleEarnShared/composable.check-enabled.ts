import { Address, Wei } from '@/core'
import { MAX_UINT256 } from './const'
import { MaybeRef } from '@vueuse/core'

export function useEnableState(props: {
  contract: MaybeRef<Address>
  spender: MaybeRef<Address>
  active?: MaybeRef<boolean>
}) {
  const dexStore = useDexStore()
  const { notify } = useNotify()

  const checkAllowanceScope = useParamScope(
    () => {
      const activeDex = dexStore.active
      if (activeDex.kind !== 'named' || !(unref(props.active) ?? false)) return null
      const dex = activeDex.dex()
      const spender = unref(props.spender)
      const contract = unref(props.contract)
      return {
        key: `dex-${activeDex.wallet}-${spender}-${contract}`,
        payload: { spender, contract, dex },
      }
    },
    ({ payload: { spender, contract, dex } }) => {
      const { state, run: touch } = useTask(() => dex.agent.getAllowance(contract, spender), { immediate: true })
      usePromiseLog(state, 'allowance')
      useNotifyOnError(state, notify, 'Failed to get allowance')
      return { state, touch }
    },
  )

  const isAllowancePending = computed(() => checkAllowanceScope.value?.expose.state.pending ?? false)
  const isEnabled = computed(() => {
    const allowance = checkAllowanceScope.value?.expose.state.fulfilled?.value
    if (!allowance) return false
    return allowance.asBigInt === MAX_UINT256
  })

  function touchAllowance() {
    checkAllowanceScope.value?.expose.touch()
  }

  const { state: enableState, run: enable } = useTask(async () => {
    const dex = dexStore.getNamedDexAnyway()
    await dex.agent.approveAmount(unref(props.contract), new Wei(MAX_UINT256), unref(props.spender))
  })
  usePromiseLog(enableState, 'enable')
  useNotifyOnError(enableState, notify, 'Failed to set max possible allowance')
  wheneverFulfilled(enableState, touchAllowance)
  const isEnablePending = toRef(enableState, 'pending')

  return {
    pending: logicOr(isAllowancePending, isEnablePending),
    enable,
    enabled: isEnabled,
  }
}
