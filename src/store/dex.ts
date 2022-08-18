import { acceptHMRUpdate, defineStore } from 'pinia'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Dex, DexAnon, NETWORK, AbiLoader, useWeb3Provider, ADDRESS_ROUTER, ADDRESS_FACTORY, Address } from '@/core'
import invariant from 'tiny-invariant'

type ActiveDex =
  | {
      kind: 'anon'
      dex: () => DexAnon
    }
  | {
      kind: 'named'
      wallet: string
      dex: () => Dex
    }

const abi = new AbiLoader()
const commonAddrs = { router: ADDRESS_ROUTER, factory: ADDRESS_FACTORY }
const anonymousProvider = new JsonRpcProvider(NETWORK.rpcUrl)
const dexAnon = await DexAnon.initAnonymous({
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
  } = useWeb3Provider({ network: NETWORK })

  const dexByProvider = computed(() => {
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

  const anyDex = computed<{
    key: string
    dex: () => DexAnon | Dex
  }>(() => {
    const x = active.value
    return x.kind === 'anon' ? { key: 'anon', dex: x.dex } : { key: `wallet-${x.wallet}`, dex: x.dex }
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
  }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useDexStore, import.meta.hot))
