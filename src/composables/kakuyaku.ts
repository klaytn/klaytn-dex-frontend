import { Task } from '@vue-kakuyaku/core'

export function useTaskLog(task: Task<unknown>, name: string) {
  const prefix = `[task: ${name}]`

  watchEffect(() => {
    console.log(`${prefix} state:`, { ...task.state })
  })
}
