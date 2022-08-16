import detectEthereumProvider from '@metamask/detect-provider'
import { type ExternalProvider, Web3Provider, type JsonRpcProvider } from '@ethersproject/providers'
import type { Address, Kaikas, Network as AppNetwork } from './types'
import { and, type MaybeRef, not } from '@vueuse/core'
import { type Ref } from 'vue'
import { type PromiseStateAtomic } from '@vue-kakuyaku/core'

const KAIKAS = window.klaytn ?? null

export const isKaikasDetected = !!KAIKAS

export type SupportedWallet = 'kaikas' | 'metamask'

/**
 * https://github.com/pancakeswap/pancake-frontend/blob/8a88b53db0b575437f94311aaaac59c3d910ead9/src/utils/wallet.ts#L26
 */
async function setupEthereumProviderNetwork(provider: JsonRpcProvider, network: AppNetwork) {
  const chainId = `0x${network.chainId.toString(16)}`

  try {
    await provider.send('wallet_switchEthereumChain', [{ chainId }])
  } catch (switchError) {
    if ((switchError as any)?.code === 4902) {
      await provider.send('wallet_addEthereumChain', [
        {
          chainId,
          chainName: network.chainName,
          nativeCurrency: network.nativeToken,
          rpcUrls: [network.rpcUrl],
          blockExplorerUrls: [network.blockExplorerUrl],
        },
      ])
    } else {
      throw switchError
    }
  }
}

interface ExtendedExternalProvider extends ExternalProvider {
  on: {
    (event: 'accountsChanged', cb: (accounts: Address[]) => void): void
    (event: 'chainChanged', cb: (chainId: string) => void): void
  }
  removeListener: (event: string, cb: (...args: any[]) => void) => void
  selectedAddress: Address
}

function getFirstAddress(accounts: Address[]): null | Address {
  return accounts.at(0) ?? null
}

function useChainGuard(provider: Ref<JsonRpcProvider>, enabled: Ref<boolean>, expectedChainId: MaybeRef<number>) {
  const chainId = useParamScope(enabled, () => {
    const { state, run } = useTask(
      async () => {
        const net = await provider.value.getNetwork()
        return net.chainId
      },
      { immediate: true },
    )
    usePromiseLog(state, 'get-chain-id')
    watch(provider, () => run())

    return state
  })

  const isLoaded = computed(() => !!chainId.value?.expose.fulfilled)
  const isCorrect = computed(() => chainId.value?.expose.fulfilled?.value === unref(expectedChainId))
  const isPending = computed(() => chainId.value?.expose.pending ?? false)

  return { isCorrect, isLoaded, isPending }
}

interface ConnectedProvider {
  wallet: SupportedWallet
  provider: Web3Provider
  account: Address
}

export function useWeb3Provider(props: { network: AppNetwork }) {
  const { state: detectMetamaskState, run: detectMetamask } = useTask(
    () => detectEthereumProvider({ mustBeMetaMask: true }) as Promise<null | ExtendedExternalProvider>,
    { immediate: true },
  )
  useErrorRetry(detectMetamaskState, detectMetamask, { count: Infinity, interval: 1_000 })
  usePromiseLog(detectMetamaskState, 'detect-eth-provider')
  const isMetamaskDetectionDone = computed(() => !!detectMetamaskState.fulfilled)
  const detectedMetamask = computed(() => detectMetamaskState.fulfilled?.value ?? null)
  const isMetamaskDetected = computed(() => !!detectedMetamask.value)

  // TODO reset this value when it is set to some wallet but wallet is not detected
  const selectedWallet = useLocalStorage<SupportedWallet | null>('selected-wallet', null)

  function selectWallet(wallet: SupportedWallet | null) {
    selectedWallet.value = wallet
  }

  type RawProvider =
    | {
        kind: 'kaikas'
        kaikas: Kaikas
      }
    | {
        kind: 'metamask'
        ethereum: ExtendedExternalProvider
      }

  interface ProviderScope {
    provider: Web3Provider
    account: null | Address
    isChainLoaded: boolean
    isChainCorrect: boolean
    isSetupPending: boolean
    enableState: PromiseStateAtomic<void>
  }

  const providerScope = useParamScope<ProviderScope, SupportedWallet, RawProvider>(
    computed(() => {
      const wallet = selectedWallet.value

      return (
        wallet &&
        (wallet === 'kaikas' && KAIKAS
          ? { key: wallet, payload: { kind: wallet, kaikas: KAIKAS } }
          : wallet === 'metamask' && detectedMetamask.value
          ? { key: wallet, payload: { kind: wallet, ethereum: detectedMetamask.value } }
          : null)
      )
    }),
    (wallet): ProviderScope => {
      if (wallet.kind === 'kaikas') {
        const { kaikas } = wallet
        const providerFactory = () => markRaw(new Web3Provider(kaikas as any as ExternalProvider))
        const provider = shallowRef(providerFactory())
        const updateProvider = () => {
          provider.value = providerFactory()
        }

        const { state: enableState } = useTask(
          async () => {
            await kaikas.enable()
          },
          { immediate: true },
        )
        usePromiseLog(enableState, 'enable-kaikas')
        const enabled = computed(() => !!enableState.fulfilled)

        wheneverRejected(enableState, () => selectWallet(null))

        const account = ref<null | Address>(null)
        const onAccountsChange = (accounts: Address[]) => {
          account.value = getFirstAddress(accounts)
        }
        kaikas.on('accountsChanged', onAccountsChange)
        onScopeDispose(() => kaikas.removeListener('accountsChanged', onAccountsChange))

        const {
          isCorrect: isChainCorrect,
          isLoaded: isChainLoaded,
          isPending: isChainPending,
        } = useChainGuard(provider, enabled, props.network.chainId)

        kaikas.on('networkChanged', updateProvider)
        onScopeDispose(() => kaikas.removeListener('networkChanged', updateProvider))

        wheneverFulfilled(enableState, () => {
          account.value = kaikas.selectedAddress
        })

        const isSetupPending = computed(() => enableState.pending || isChainPending.value)

        return reactive({ account, provider, isChainCorrect, isChainLoaded, enableState, isSetupPending })
      } else {
        const { ethereum } = wallet
        const providerFactory = () => markRaw(new Web3Provider(ethereum))
        const provider = shallowRef(providerFactory())
        const updateProvider = () => {
          provider.value = providerFactory()
        }

        const { state: enableState } = useTask(
          async () => {
            await provider.value.send('eth_requestAccounts', [])
          },
          { immediate: true },
        )
        usePromiseLog(enableState, 'enable-ethereum')
        const enabled = computed(() => !!enableState.fulfilled)

        wheneverRejected(enableState, () => selectWallet(null))

        const account = ref<null | Address>(ethereum.selectedAddress)
        const onAccountsChanged = (accounts: Address[]) => {
          account.value = getFirstAddress(accounts)
        }
        ethereum.on('accountsChanged', onAccountsChanged)
        onScopeDispose(() => ethereum.removeListener('accountsChanged', onAccountsChanged))

        const {
          isCorrect: isChainCorrect,
          isLoaded: isChainLoaded,
          isPending: isChainPending,
        } = useChainGuard(provider, enabled, props.network.chainId)
        ethereum.on('chainChanged', updateProvider)
        onScopeDispose(() => ethereum.removeListener('chainChanged', updateProvider))

        const { run: trySwitchNetwork, state: switchNetworkState } = useTask(async () => {
          await setupEthereumProviderNetwork(provider.value, props.network)
        })
        usePromiseLog(switchNetworkState, 'ethereum-switch-network')

        wheneverFulfilled(switchNetworkState, updateProvider)
        whenever(and(isChainLoaded, not(isChainCorrect)), trySwitchNetwork, { immediate: true })

        const isSetupPending = computed(() => enableState.pending || switchNetworkState.pending || isChainPending.value)

        return reactive({ account, provider, isChainCorrect, isChainLoaded, enableState, isSetupPending })
      }
    },
  )

  const validProvider = computed<ConnectedProvider | null>(() => {
    if (providerScope.value) {
      const {
        expose: { provider, account, isChainCorrect },
        payload: { kind: wallet },
      } = providerScope.value

      if (isChainCorrect && account) {
        return {
          wallet,
          provider,
          account,
        }
      }
    }

    return null
  })

  const connectState = computed(() => providerScope.value?.expose.enableState ?? null)
  const isChainLoaded = computed(() => providerScope.value?.expose.isChainLoaded ?? false)
  const isChainCorrect = computed(() => providerScope.value?.expose.isChainCorrect ?? false)
  const isProviderSetupPending = computed(() => providerScope.value?.expose.isSetupPending ?? false)

  return {
    isMetamaskDetectionDone,
    isMetamaskDetected,

    selectedWallet,
    selectWallet,

    connectState,
    validProvider,
    isChainLoaded,
    isChainCorrect,
    isProviderSetupPending,
  }
}
