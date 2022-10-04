import { MaybeRef } from '@vueuse/core'
import { defineStore } from 'pinia'
import invariant from 'tiny-invariant'

interface RefreshAPI {
  run: () => void
  pending: MaybeRef<boolean>
}

export const useTradeStore = defineStore('trade', () => {
  const refresh = shallowRef<null | RefreshAPI>(null)

  function useRefresh(api: RefreshAPI) {
    invariant(!refresh.value)
    refresh.value = api
    onScopeDispose(() => {
      refresh.value = null
    })
  }

  return { refresh, useRefresh }
})
