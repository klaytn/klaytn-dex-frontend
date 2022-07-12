import { Task, wheneverTaskErrors } from '@vue-kakuyaku/core'
import { Status } from '@soramitsu-ui/ui'
import Debug from 'debug'

export function useTaskLog(task: Task<unknown>, name: string) {
  const debug = Debug('kakuyaku').extend(name)

  watchEffect(() => {
    debug('state: %o', { ...task.state })
    if (task.state.kind === 'err') {
      console.error(`Task "${name}" errored:`, task.state.error)
    }
  })
}

export function useNotifyOnError(task: Task<unknown>, message: string) {
  wheneverTaskErrors(task, () => {
    $notify({ status: Status.Error, description: message })
  })
}
