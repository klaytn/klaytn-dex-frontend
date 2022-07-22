import { Address, Wei } from '@/core/kaikas'
import { useTask, wheneverTaskErrors } from '@vue-kakuyaku/core'
import { Status } from '@soramitsu-ui/ui'
import { MAX_UINT256 } from './const'
import { MaybeRef } from '@vueuse/core'

export function useEnableState(addr: MaybeRef<Address>, contractAddr: MaybeRef<Address>) {
  const kaikasStore = useKaikasStore()

  const checkEnabledTask = useTask(async () => {
    const allowance = await kaikasStore.getKaikasAnyway().cfg.getAllowance(unref(addr), unref(contractAddr))
    const isEnabled = allowance.asBigInt === MAX_UINT256
    return isEnabled
  })
  useTaskLog(checkEnabledTask, 'use-enable-state-check')
  wheneverTaskErrors(checkEnabledTask, () => {
    $notify({ status: Status.Error, description: 'Fetch enabled pools error' })
  })
  const checkEnabledInProgress = computed(() => checkEnabledTask.state.kind === 'pending')

  const enableTask = useTask(async () => {
    const kaikas = kaikasStore.getKaikasAnyway()
    await kaikas.cfg.approveAmount(unref(addr), new Wei(MAX_UINT256), unref(contractAddr))
  })
  useTaskLog(enableTask, 'use-enable-state-enable')
  wheneverTaskErrors(enableTask, () => {
    $notify({ status: Status.Error, description: 'Approve amount error' })
  })

  const enabled = computed(() => {
    return enableTask.state.kind === 'ok' || (checkEnabledTask.state.kind === 'ok' && checkEnabledTask.state.data)
  })

  return {
    pending: checkEnabledInProgress,
    check: () => checkEnabledTask.run(),
    enable: () => enableTask.run(),
    enabled,
  }
}
