import { Address, asWei } from '@/core/kaikas'
import BigNumber from 'bignumber.js'
import { MAX_UINT256 } from './const'
import { MaybeRef, or } from '@vueuse/core'

export function useEnableState(addr: MaybeRef<Address>, contractAddr: MaybeRef<Address>) {
  const kaikasStore = useKaikasStore()

  async function checkFn(): Promise<boolean> {
    const allowance = await kaikasStore.getKaikasAnyway().cfg.getAllowance(unref(addr), unref(contractAddr))
    const isEnabled = new BigNumber(allowance).isEqualTo(MAX_UINT256)
    return isEnabled
  }

  async function enableFn() {
    const kaikas = kaikasStore.getKaikasAnyway()
    await kaikas.cfg.approveAmount(unref(addr), asWei(MAX_UINT256.toFixed()), unref(contractAddr))
  }

  const checkPromise = usePromise<boolean>()
  const isCheckPending = toRef(checkPromise.state, 'pending')
  useNotifyOnError(checkPromise.state, 'Fetch enabled pools error')
  function check() {
    checkPromise.set(checkFn())
  }

  const enablePromise = usePromise()
  const isEnablePending = toRef(enablePromise.state, 'pending')
  useNotifyOnError(enablePromise.state, 'Fetch enabled pools error')
  function enable() {
    enablePromise.set(enableFn())
  }

  const isEnabled = computed(() => !!enablePromise.state.fulfilled && !!checkPromise.state.fulfilled?.value)

  return {
    pending: or(isCheckPending, isEnablePending),
    check,
    enable,
    enabled: isEnabled,
  }
}
