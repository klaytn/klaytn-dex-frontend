import { acceptHMRUpdate, defineStore } from 'pinia'
import { JsonRpcProvider } from '@ethersproject/providers'
import {
  ADDRESS_FACTORY,
  ADDRESS_ROUTER,
  AbiLoader,
  Address,
  Dex,
  DexPure,
  NETWORK,
  SupportedWallet,
  useWeb3Provider,
} from '@/core'
import invariant from 'tiny-invariant'

export type ActiveDex =
  | {
      kind: 'anon'
      dex: () => DexPure
    }
  | {
      kind: 'named'
      wallet: SupportedWallet
      dex: () => Dex
    }

export interface AnyDex {
  key: 'anon' | SupportedWallet
  dex: () => DexPure | Dex
}

const abi = new AbiLoader()
const commonAddrs = { router: ADDRESS_ROUTER, factory: ADDRESS_FACTORY }
const anonymousProvider = new JsonRpcProvider(NETWORK.rpcUrl)
const dexAnon = await DexPure.initAnonymous({
  provider: { kind: 'ethers', ethers: anonymousProvider },
  addrs: commonAddrs,
  abi,
})

export const useDexStore = defineStore('dex', () => {
  const {
    isMetamaskDetected,
    isMetamaskDetectionDone,
    validProvider,
    selectWallet,
    selectedWallet,
    connectState,
    isChainCorrect,
    isChainLoaded,
    isProviderSetupPending,
    initialDelayActive,
    isEnabled,
    enable,
  } = useWeb3Provider({ network: NETWORK })

  const dexByProvider = computed(() => {
    invariant(!initialDelayActive.value, 'Dex should not be accessed in any way while initial delay is active')

    const connected = validProvider.value
    if (!connected) return null

    const { provider, account } = connected

    return {
      wallet: connected.wallet,
      dex: Dex.init({ provider, addrs: commonAddrs, abi }, account),
    }
  })

  const active = computed<ActiveDex>(() => {
    if (dexByProvider.value) {
      const { dex, wallet } = dexByProvider.value
      return { kind: 'named', wallet, dex: () => dex }
    }

    return {
      kind: 'anon',
      dex: () => dexAnon,
    }
  })

  const anyDex = computed<AnyDex>(() => {
    const x = active.value
    return x.kind === 'anon' ? { key: 'anon', dex: x.dex } : { key: x.wallet, dex: x.dex }
  })

  const account = computed<Address | null>(() =>
    active.value.kind === 'named' ? active.value.dex().agent.address : null,
  )

  const isWalletConnected = computed(() => active.value.kind === 'named')

  function getNamedDexAnyway() {
    const act = active.value
    invariant(act.kind === 'named')
    return act.dex()
  }

  const openModal = ref(false)

  whenever(
    () => !!connectState.value?.fulfilled,
    () => {
      openModal.value = false
    },
  )

  return {
    abi: () => abi,

    isMetamaskDetected,
    isMetamaskDetectionDone,
    selectWallet,
    selectedWallet,
    connectState,
    isChainCorrect,
    isChainLoaded,
    isProviderSetupPending,
    active: active,
    anyDex,
    account,
    isWalletConnected,
    getNamedDexAnyway,

    openModal,
    initialDelayActive,

    isEnabled,
    enable,
  }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useDexStore, import.meta.hot))
