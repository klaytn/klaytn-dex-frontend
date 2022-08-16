import { acceptHMRUpdate, defineStore } from 'pinia'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Dex, DexAnon, NETWORK, AbiLoader, useWeb3Provider, ADDRESS_ROUTER, ADDRESS_FACTORY, Address } from '@/core'

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
const dexAnon = await DexAnon.initAnonymous({ provider: anonymousProvider, addrs: commonAddrs, abi })

export const useDexStore = defineStore('dex', () => {
  const {
    isMetamaskDetected,
    isMetamaskDetectionDone,
    validProvider: validWeb3Provider,
    selectWallet,
    selectedWallet,
    connectState,
    isChainCorrect,
    isChainLoaded,
    isProviderSetupPending,
  } = useWeb3Provider({ network: NETWORK })

  const dexByProvider = useParamScope(
    computed(() => {
      const prov = validWeb3Provider.value
      if (!prov) return null
      return {
        key: prov.wallet,
        payload: prov,
      }
    }),
    ({ provider, account }) => {
      const { state } = useTask(() => Dex.init({ provider, addrs: commonAddrs, abi }, account), { immediate: true })
      return state
    },
  )

  const active = computed<ActiveDex>(() => {
    if (dexByProvider.value?.expose.fulfilled) {
      const {
        expose: {
          fulfilled: { value: dex },
        },
        key: wallet,
      } = dexByProvider.value
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

  return {
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
  }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useDexStore, import.meta.hot))
