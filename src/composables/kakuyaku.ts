import { Task } from '@vue-kakuyaku/core'
import Debug from 'debug'

export function useTaskLog(task: Task<unknown>, name: string) {
  const debug = Debug('kakuyaku').extend(name)

  watchEffect(() => {
    debug('state: %o', { ...task.state })
  })
}
