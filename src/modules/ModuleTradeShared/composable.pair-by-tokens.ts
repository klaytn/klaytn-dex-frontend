import { Address, Balance, isEmptyAddress } from '@/core/kaikas'
import { TokensPair } from '@/utils/pair'
import { useScope, useTask } from '@vue-kakuyaku/core'

export type PairAddressResult = 'unknown' | 'empty' | 'not-empty'

export function usePairAddress(pair: TokensPair<Address | null | undefined>): {
  pending: boolean
  result: PairAddressResult
  pair: null | {
    addr: Address
    pairBalance: Balance
    userBalance: Balance
  }
} {
  const kaikasStore = useKaikasStore()

  const key = computed<null | string>(() => {
    const a = pair.tokenA ?? null
    const b = pair.tokenB ?? null
    return a && b && (kaikasStore.isConnected || null) && `${a}-${b}`
  })

  const scope = useScope(key, () => {
    const kaikas = kaikasStore.getKaikasAnyway()
    const pairForSure = pair as TokensPair<Address>

    const task = useTask(async () => {
      const addr = await kaikas.tokens.getPairAddress(pairForSure)
      if (isEmptyAddress(addr)) return null
      const { userBalance, pairBalance } = await kaikas.tokens.getPairBalance(pairForSure)
      return { addr, userBalance, pairBalance }
    })

    task.run()

    useTaskLog(task, 'trade-pair-by-tokens')

    return task
  })

  const taskState = computed(() => scope.value?.setup.state ?? null)

  const pending = computed(() => taskState.value?.kind === 'pending')

  const result = computed<PairAddressResult>(() => {
    const state = taskState.value
    if (state?.kind === 'ok') {
      return state.data === null ? 'empty' : 'not-empty'
    }
    return 'unknown'
  })

  const loaded = computed(() => (taskState.value?.kind === 'ok' ? taskState.value.data : null))

  return reactive({ pair: loaded, pending, result })
}
