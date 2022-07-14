import { Status } from '@soramitsu-ui/ui'
import Debug from 'debug'
import { Except } from 'type-fest'
import { Ref, WatchOptions, WatchStopHandle } from 'vue'
import { useDanglingScope } from '@vue-kakuyaku/core'

type PromiseStateAtomic<T> = PromiseStateAtomicEmpty | PromiseStateAtomicPending | PromiseResultAtomic<T>

type PromiseResultAtomic<T> = PromiseStateAtomicFulfilled<T> | PromiseStateAtomicRejected

interface PromiseStateAtomicPending {
  pending: true
  fulfilled: null
  rejected: null
}

interface PromiseStateAtomicFulfilled<T> {
  pending: false
  fulfilled: { value: T }
  rejected: null
}

interface PromiseStateAtomicRejected {
  pending: false
  fulfilled: null
  rejected: { reason: unknown }
}

interface PromiseStateAtomicEmpty {
  pending: false
  fulfilled: null
  rejected: null
}

interface UsePromiseReturn<T> {
  state: PromiseStateAtomic<T>
  set: (promise: Promise<T>) => void
  clear: () => void
}

type WheneverPromiseOptions = Except<WatchOptions, 'deep'>

export function wheneverFulfilled<T>(
  state: PromiseStateAtomic<T>,
  fn: (value: T) => void,
  options?: WheneverPromiseOptions,
): WatchStopHandle {
  return watch(
    () => state.fulfilled,
    (x) => x && fn(x.value),
    options,
  )
}

export function wheneverRejected(
  state: PromiseStateAtomic<unknown>,
  fn: (reason: unknown) => void,
  options?: WheneverPromiseOptions,
): WatchStopHandle {
  return watch(
    () => state.rejected,
    (x) => x && fn(x.reason),
    options,
  )
}

export function wheneverDone<T>(
  state: PromiseStateAtomic<T>,
  fn: (result: PromiseResultAtomic<T>) => void,
  options?: WheneverPromiseOptions,
): WatchStopHandle {
  return watch(
    () => state.rejected || state.fulfilled,
    (x) => x && fn(state as PromiseResultAtomic<T>),
    options,
  )
}

export function usePromise<T>(): UsePromiseReturn<T> {
  let active: null | Promise<T> = null
  const state = shallowReactive<PromiseStateAtomic<T>>({
    pending: false,
    fulfilled: null,
    rejected: null,
  })

  function set(promise: Promise<T>) {
    active = promise

    state.pending = true
    state.fulfilled = null
    state.rejected = null

    promise
      .then((value) => {
        if (promise === active) {
          state.pending = false
          state.fulfilled = markRaw({ value })
        }
      })
      .catch((reason) => {
        if (promise === active) {
          state.pending = false
          state.rejected = markRaw({ reason })
        } else {
          // to not silent it
          throw reason
        }
      })
  }

  function clear() {
    active = null
  }

  return { state, set, clear }
}

export interface PromiseStaleState<T> {
  fulfilled: null | { value: T }
  rejected: null | { reason: unknown }
  pending: boolean
  fresh: boolean
}

export function useStaleState<T>(state: PromiseStateAtomic<T>): PromiseStaleState<T> {
  const staleState: PromiseStaleState<T> = shallowReactive({
    fulfilled: null,
    rejected: null,
    pending: false,
    fresh: false,
  })

  watch(state, (updatedState) => {
    if (updatedState.pending) {
      staleState.pending = true
      staleState.fresh = false
    } else {
      staleState.pending = false
      if (updatedState.fulfilled) {
        staleState.fulfilled = updatedState.fulfilled
        staleState.rejected = null
        staleState.fresh = true
      } else if (updatedState.rejected) {
        staleState.rejected = updatedState.rejected
      }
    }
  })

  return staleState
}

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

export function useScopeWithAdvancedKey<K extends string | number | symbol, P, S>(
  key: Ref<null | { key: K; payload: P }>,
  fn: (payload: P) => S,
): Ref<null | { expose: S; key: K; payload: P }> {
  const { scope, setup, dispose } = useDanglingScope<{ expose: S; key: K; payload: P }>()

  watch(
    () => key.value?.key,
    (actualKey) => {
      if (!actualKey) {
        dispose()
      } else {
        setup(() => {
          const { payload } = key.value!
          const expose = fn(payload)
          return { expose, payload, key: actualKey }
        })
      }
    },
    { immediate: true },
  )

  return computed(() => scope.value?.setup ?? null)
}
