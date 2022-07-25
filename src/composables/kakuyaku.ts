import { Status } from '@soramitsu-ui/ui'
import Debug from 'debug'
import { PromiseStateAtomic } from '@vue-kakuyaku/core'

interface PromiseStateBoolInvariantPending {
  pending: true
  fulfilled: false
  rejected: false
}

interface PromiseStateBoolInvariantFulfilled {
  pending: false
  fulfilled: true
  rejected: false
}

interface PromiseStateBoolInvariantRejected {
  pending: false
  fulfilled: false
  rejected: true
}

interface PromiseStateBoolInvariantEmpty {
  pending: false
  fulfilled: false
  rejected: false
}

type PromiseStateBoolAtomic =
  | PromiseStateBoolInvariantEmpty
  | PromiseStateBoolInvariantFulfilled
  | PromiseStateBoolInvariantRejected
  | PromiseStateBoolInvariantPending

export function usePromiseLog(state: PromiseStateAtomic<unknown>, name: string) {
  const debug = Debug('kakuyaku').extend(name)

  watch(
    state,
    (state) => {
      if (state.pending) {
        debug('pending...')
      } else if (state.fulfilled) {
        debug('fulfilled: %o', state.fulfilled.value)
      } else if (state.rejected) {
        debug('rejected: %o', state.rejected.reason)
        console.error(`Promise "${name}" errored:`, state.rejected.reason)
      }
    },
    { deep: true },
  )
}

export function useNotifyOnError(state: PromiseStateAtomic<unknown>, message: string) {
  wheneverRejected(state, () => {
    $notify({ status: Status.Error, description: message })
  })
}

export function promiseStateToFlags(state: PromiseStateAtomic<unknown>): PromiseStateBoolAtomic {
  return readonly({
    pending: toRef(state, 'pending'),
    fulfilled: computed(() => !!state.fulfilled),
    rejected: computed(() => !!state.rejected),
  }) as PromiseStateBoolAtomic
}
