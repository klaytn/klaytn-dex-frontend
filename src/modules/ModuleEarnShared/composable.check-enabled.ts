import { Address, Wei } from '@/core/kaikas'
import { MAX_UINT256 } from './const'
import { MaybeRef, or } from '@vueuse/core'
import { Ref } from 'vue'

export function useEnableState({
  addr,
  contractAddr,
  active,
}: {
  addr: MaybeRef<Address>
  contractAddr: MaybeRef<Address>
  active: Ref<boolean>
}) {
  const kaikasStore = useKaikasStore()

  const checkAllowanceScope = useParamScope(
    computed(() => {
      if (!kaikasStore.isConnected || !unref(active)) return null
      const self = unref(addr)
      const contract = unref(contractAddr)
      return {
        key: `${self}-${contract}`,
        payload: { self, contract },
      }
    }),
    ({ self, contract }) => {
      const { state, run: touch } = useTask(() => kaikasStore.getKaikasAnyway().cfg.getAllowance(self, contract), {
        immediate: true,
      })
      usePromiseLog(state, 'allowance')
      useNotifyOnError(state, 'Failed to get allowance')
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
    const kaikas = kaikasStore.getKaikasAnyway()
    await kaikas.cfg.approveAmount(unref(addr), new Wei(MAX_UINT256), unref(contractAddr))
  })
  usePromiseLog(enableState, 'enable')
  useNotifyOnError(enableState, 'Failed to set max possible allowance')
  wheneverFulfilled(enableState, touchAllowance)
  const isEnablePending = toRef(enableState, 'pending')

  return {
    pending: or(isAllowancePending, isEnablePending),
    enable,
    enabled: isEnabled,
  }
}
