import { Task, wheneverTaskErrors } from '@vue-kakuyaku/core'
import { Status } from '@soramitsu-ui/ui'
import Debug from 'debug'

export function useTaskLog(task: Task<unknown>, name: string) {
  const debug = Debug('kakuyaku').extend(name)

  watchEffect(() => {
    const state = task.state
    if (state.kind !== 'uninit') {
      if (state.kind === 'ok') {
        debug('ok: %o', state.data)
      } else if (state.kind === 'err') {
        debug('err: %o', state.error)
        console.error(`Task "${name}" errored:`, state.error)
      } else if (state.kind === 'pending') {
        debug('pending...')
      } else {
        debug('aborted')
      }
    }
  })

  onScopeDispose(() => {
    debug('disposed')
  })
}

export function useNotifyOnError(task: Task<unknown>, message: string) {
  wheneverTaskErrors(task, () => {
    $notify({ status: Status.Error, description: message })
  })
}
