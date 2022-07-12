import { Address, isEmptyAddress } from '@/core/kaikas'
import { TokensPair } from '@/utils/pair'
import { Task, useScope, useTask } from '@vue-kakuyaku/core'
import { Ref } from 'vue'

export type PairAddressResult = 'unknown' | 'empty' | 'not-empty'

export function usePairAddress(
  pair: TokensPair<Address | null | undefined>,
): Ref<null | Task<{ pair: Address; isEmpty: boolean }>> {
  const kaikasStore = useKaikasStore()

  const key = computed<null | string>(() => {
    const a = pair.tokenA ?? null
    const b = pair.tokenB ?? null
    return a && b && (kaikasStore.isConnected || null) && `${a}-${b}`
  })

  const scope = useScope<Task<{ pair: Address; isEmpty: boolean }>, string>(key, () => {
    const kaikas = kaikasStore.getKaikasAnyway()
    const a = pair.tokenA!
    const b = pair.tokenB!

    const task = useTask(async () => {
      const pair = await kaikas.tokens.getPairAddress(a, b)
      const isEmpty = isEmptyAddress(pair)
      return { pair, isEmpty }
    })

    task.run()

    useTaskLog(task, 'pair-addr')

    return task
  })

  return computed(() => scope.value?.setup ?? null)
}
