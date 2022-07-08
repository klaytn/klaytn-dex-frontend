import { acceptHMRUpdate, defineStore } from 'pinia'
import { Kaikas, Config } from '@/core/kaikas'

export type KaikasStatus = 'uninit' | 'not-installed' | 'connected'

export const useKaikasStore = defineStore('kaikas', () => {
  const kaikasState = shallowRef<null | { status: 'kaikas-not-installed' } | { status: 'connected'; kaikas: Kaikas }>(
    null,
  )

  async function connect() {
    const cfgResult = await Config.connectKaikas()

    if (cfgResult.status === 'kaikas-not-installed') {
      kaikasState.value = cfgResult
      return
    }

    kaikasState.value = {
      status: 'connected',
      kaikas: markRaw(new Kaikas(cfgResult.cfg)),
    }
  }

  const status = computed<KaikasStatus>(() => {
    const state = kaikasState.value
    if (!state) return 'uninit'
    if (state.status === 'kaikas-not-installed') return 'not-installed'
    return 'connected'
  })

  const kaikas = computed(() => (kaikasState.value?.status === 'connected' ? kaikasState.value.kaikas : null))
  const address = computed(() => kaikas.value?.cfg.addrs.self)
  const isNotInstalled = computed(() => status.value === 'not-installed')
  const isConnected = computed(() => status.value === 'connected')

  function getKaikasAnyway(): Kaikas {
    if (status.value === 'connected') return kaikas.value!
    throw new Error(`Kaikas is not connected, but "${status.value}"`)
  }

  return {
    kaikas,
    address,
    status,
    isNotInstalled,
    isConnected,
    connect,
    getKaikasAnyway,
  }
})

import.meta.hot?.accept(acceptHMRUpdate(useKaikasStore, import.meta.hot))
