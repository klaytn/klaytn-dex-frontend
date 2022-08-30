import { AgentPure } from '@/core'
import { MaybeRef } from '@vueuse/core'
import invariant from 'tiny-invariant'
import { Ref } from 'vue'

export function useBlockNumber(agent: MaybeRef<AgentPure>): Ref<number | null> {
  const blockNumber = ref<number | null>(null)
  const inc = () => {
    invariant(typeof blockNumber.value === 'number')
    blockNumber.value++
  }
  const { resume } = useIntervalFn(inc, 1000, { immediate: false })

  const { state } = useTask<number>(() => unref(agent).getBlockNumber(), { immediate: true })
  wheneverFulfilled(state, (num) => {
    blockNumber.value = num
    resume()
  })

  return blockNumber
}
