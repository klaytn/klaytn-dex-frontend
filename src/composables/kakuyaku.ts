import { Status } from '@soramitsu-ui/ui'
import Debug from 'debug'
import { Except } from 'type-fest'
import { Ref, WatchOptions, WatchStopHandle } from 'vue'

type Nullable<T> = null | undefined | T

type PromiseResult<T> = { kind: 'fulfilled'; value: T } | { kind: 'rejected'; reason: unknown }

type PromiseState<T> = { kind: 'pending' } | PromiseResult<T>

interface UsePromiseReturn<T> {
  state: Ref<null | PromiseState<T>>
  set: (promise: Promise<T>) => void
  clear: () => void
}

function resultRaw<T>(result: PromiseResult<T>): PromiseResult<T> {
  return markRaw(result)
}

type WheneverPromiseOptions = Except<WatchOptions, 'deep'>

export function wheneverFulfilled<T>(
  state: Ref<Nullable<PromiseState<T>>>,
  fn: (value: T) => void,
  options?: WheneverPromiseOptions,
): WatchStopHandle {
  return watch(
    state,
    (state) => {
      if (state?.kind === 'fulfilled') {
        fn(state.value)
      }
    },
    options,
  )
}

export function wheneverRejected(
  state: Ref<Nullable<PromiseState<unknown>>>,
  fn: (reason: unknown) => void,
  options?: WheneverPromiseOptions,
): WatchStopHandle {
  return watch(
    state,
    (state) => {
      if (state?.kind === 'rejected') {
        fn(state.reason)
      }
    },
    options,
  )
}

export function wheneverDone<T>(
  state: Ref<Nullable<PromiseState<T>>>,
  fn: (result: PromiseResult<T>) => void,
  options?: WheneverPromiseOptions,
): WatchStopHandle {
  return watch(
    state,
    (state) => {
      if (state && state.kind !== 'pending') {
        fn(state)
      }
    },
    options,
  )
}

export function usePromise<T>(): UsePromiseReturn<T> {
  let active: null | Promise<T> = null
  const state = shallowRef<null | PromiseState<T>>(null)

  function set(promise: Promise<T>) {
    active = promise

    state.value = { kind: 'pending' }

    promise
      .then((value) => {
        if (promise === active) {
          state.value = resultRaw({ kind: 'fulfilled', value })
        }
      })
      .catch((reason) => {
        if (promise === active) {
          state.value = resultRaw({ kind: 'rejected', reason })
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

export interface PromiseStateFlatten<T> {
  pending: boolean
  fulfilled: null | { value: T }
  rejected: null | { reason: unknown }
}

export function useFlattenState<T>(state: Ref<Nullable<PromiseState<T>>>): PromiseStateFlatten<T> {
  return reactive({
    pending: computed(() => state.value?.kind === 'pending'),
    fulfilled: computed(() => (state.value?.kind === 'fulfilled' ? markRaw({ value: state.value.value }) : null)),
    rejected: computed(() => (state.value?.kind === 'rejected' ? markRaw({ reason: state.value.reason }) : null)),
  })
}

export interface PromiseStaleState<T> extends PromiseStateFlatten<T> {
  fresh: boolean
}

export function useStaleState<T>(state: Ref<Nullable<PromiseState<T>>>): PromiseStaleState<T> {
  const stale: PromiseStaleState<T> = reactive({})

  watch(state, (state) => {}, { flush: 'sync' })

  return stale
}

export function usePromiseLog(promiseState: Ref<Nullable<PromiseState<unknown>>>, name: string) {
  const debug = Debug('kakuyaku').extend(name)

  watchEffect(() => {
    const state = promiseState.value
    if (state) {
      if (state.kind === 'fulfilled') {
        debug('fulfilled: %o', state.value)
      } else if (state.kind === 'rejected') {
        debug('rejected: %o', state.reason)
        console.error(`Promise "${name}" errored:`, state.reason)
      } else if (state.kind === 'pending') {
        debug('pending...')
      }
    }
  })
}

export function useNotifyOnError(state: Ref<Nullable<PromiseState<unknown>>>, message: string) {
  wheneverRejected(state, () => {
    $notify({ status: Status.Error, description: message })
  })
}
