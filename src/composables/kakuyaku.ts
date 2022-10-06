import Debug from 'debug'
import { PromiseStateAtomic } from '@vue-kakuyaku/core'
import { NotifyFn } from '@/plugins/notifications'

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
    (state: PromiseStateAtomic<unknown>) => {
      if (state.pending) {
        debug('pending...')
      } else if (state.fulfilled) {
        debug('fulfilled with value: %o', state.fulfilled.value)
      } else if (state.rejected) {
        debug('rejected')
        console.error(`Promise "${name}" errored:`, state.rejected.reason)
      }
    },
    { deep: true, immediate: true },
  )

  onScopeDispose(() => {
    debug('disposed')
  })
}

export function useNotifyOnError(state: PromiseStateAtomic<unknown>, notify: NotifyFn, message?: string) {
  wheneverRejected(state, (error) => {
    notify({ type: 'err', title: message, error })
  })
}

export function promiseStateToFlags(state: PromiseStateAtomic<unknown>): PromiseStateBoolAtomic {
  return readonly({
    pending: toRef(state, 'pending'),
    fulfilled: computed(() => !!state.fulfilled),
    rejected: computed(() => !!state.rejected),
  }) as PromiseStateBoolAtomic
}
