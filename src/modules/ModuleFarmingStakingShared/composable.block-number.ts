import { Kaikas } from '@/core/kaikas'
import { useTask, useScope } from '@vue-kakuyaku/core'
import invariant from 'tiny-invariant'
import { Ref } from 'vue'

export function useBlockNumber(kaikas: Kaikas): Ref<number | null> {
  const blockNumber = ref<number | null>(null)

  const task = useTask(async () => {
    const value = await kaikas.cfg.caver.klay.getBlockNumber()
    blockNumber.value = value
  })
  task.run()

  useScope(
    computed(() => blockNumber.value !== null),
    () => {
      useIntervalFn(() => {
        invariant(typeof blockNumber.value === 'number')
        blockNumber.value++
      }, 1000)
    },
  )

  return blockNumber
}
