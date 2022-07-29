import { Address, Wei } from '@/core/kaikas'
import { MAX_UINT256 } from './const'
import { MaybeRef, or } from '@vueuse/core'

export function useEnableState(addr: MaybeRef<Address>, contractAddr: MaybeRef<Address>) {
  const kaikasStore = useKaikasStore()
  const { notify } = useNotify()

  const { state: checkState, run: check } = useTask(async () => {
    const allowance = await kaikasStore.getKaikasAnyway().cfg.getAllowance(unref(addr), unref(contractAddr))
    const isEnabled = allowance.asBigInt === MAX_UINT256
    return isEnabled
  })
  const isCheckPending = toRef(checkState, 'pending')
  useNotifyOnError(checkState, notify, 'Fetch enabled pools error')

  const { state: enableState, run: enable } = useTask(async () => {
    const kaikas = kaikasStore.getKaikasAnyway()
    await kaikas.cfg.approveAmount(unref(addr), new Wei(MAX_UINT256), unref(contractAddr))
  })
  const isEnablePending = toRef(enableState, 'pending')
  useNotifyOnError(enableState, notify, 'Fetch enabled pools error')

  const isEnabled = computed(() => !!enableState.fulfilled && !!checkState.fulfilled?.value)

  return {
    pending: or(isCheckPending, isEnablePending),
    check,
    enable,
    enabled: isEnabled,
  }
}
