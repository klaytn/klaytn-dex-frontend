import detectEthereumProvider from '@metamask/detect-provider'
import { type ExternalProvider, JsonRpcProvider, Web3Provider } from '@ethersproject/providers'
import type { Address, Network as AppNetwork, Kaikas } from './types'
import { type MaybeRef } from '@vueuse/core'
import { type Ref } from 'vue'
import { type PromiseStateAtomic } from '@vue-kakuyaku/core'
import type Caver from 'caver-js'
import type { AgentProvider } from './domain/agent'

const INITIAL_DELAY_TIMEOUT = 300

const KAIKAS_STATE_POLL_INTERVAL = 1000

// function patchKaikas(
//   kaikas: Kaikas,
//   props: {
//     getAccounts: () => Address[]
//   },
// ): ExternalProvider {
//   async function sendAsync(...args: any[]) {
//     const [{ method, jsonrpc, id }, callback] = args
//     if (method === 'eth_accounts') {
//       callback(null, { result: props.getAccounts(), id, jsonrpc })
//     }

//     return (kaikas.sendAsync as any)(...args)
//   }

//   return new Proxy(kaikas, {
//     get(target, prop) {
//       if (prop === 'sendAsync') return sendAsync
//       return (target as any)[prop]
//     },
//   }) as any
// }

type KaikasWithCaver = Required<Pick<Window, 'klaytn' | 'caver'>>

let KAIKAS: null | undefined | KaikasWithCaver
{
  const { caver, klaytn } = window
  KAIKAS = caver && klaytn && { caver, klaytn }
}

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
  provider: AgentProvider
  account: Address
}

export function useWeb3Provider(props: { network: AppNetwork }) {
  const { state: detectMetamaskState, run: detectMetamask } = useTask(
    () => detectEthereumProvider({ mustBeMetaMask: true, silent: true }) as Promise<null | ExtendedExternalProvider>,
    { immediate: true },
  )
  useErrorRetry(detectMetamaskState, detectMetamask, { count: Infinity, interval: 1_000 })
  const isMetamaskDetectionDone = computed(() => !!detectMetamaskState.fulfilled)
  const detectedMetamask = computed(() => detectMetamaskState.fulfilled?.value ?? null)
  const isMetamaskDetected = computed(() => !!detectedMetamask.value)

  const selectedWallet = useLocalStorage<SupportedWallet | null>('selected-wallet', null)

  whenever(
    () => selectedWallet.value === 'metamask' && isMetamaskDetectionDone.value && !isMetamaskDetected.value,
    () => selectWallet(null),
    { immediate: true },
  )

  whenever(
    () => selectedWallet.value === 'kaikas' && !isKaikasDetected,
    () => selectWallet(null),
    { immediate: true },
  )

  function selectWallet(wallet: SupportedWallet | null) {
    selectedWallet.value = wallet
  }

  type RawProvider =
    | {
        kind: 'kaikas'
        kaikas: Kaikas
        caver: Caver
      }
    | {
        kind: 'metamask'
        ethereum: ExtendedExternalProvider
      }

  interface ProviderScope {
    provider: () => AgentProvider
    /**
     * It may be `null` if the provider is not connected yet
     * or if it locked
     */
    account: null | Address
    isChainLoaded: boolean
    isChainCorrect: boolean
    isSetupPending: boolean
    enableState: PromiseStateAtomic<void>
    enable: () => void
  }

  const providerScope = useParamScope(
    () => {
      const wallet = selectedWallet.value

      return (
        wallet &&
        (wallet === 'kaikas' && KAIKAS
          ? { key: wallet, payload: { kind: wallet, kaikas: KAIKAS.klaytn, caver: KAIKAS.caver } }
          : wallet === 'metamask' && detectedMetamask.value
          ? { key: wallet, payload: { kind: wallet, ethereum: detectedMetamask.value } }
          : null)
      )
    },
    ({ payload: wallet }): ProviderScope => {
      if (wallet.kind === 'kaikas') {
        const { kaikas, caver } = wallet
        const provider: AgentProvider = {
          kind: 'caver',
          caver,
          kaikas,
          unstableEthers: new Web3Provider(kaikas as any),
        }

        const { state: enableState, run: enable } = useTask(
          async () => {
            await kaikas.enable()
          },
          { immediate: true },
        )
        usePromiseLog(enableState, 'enable-kaikas')

        const account = ref<null | Address>(null)
        const onAccountsChange = (accounts: Address[]) => {
          account.value = getFirstAddress(accounts)
        }
        kaikas.on('accountsChanged', onAccountsChange)
        onScopeDispose(() => kaikas.removeListener('accountsChanged', onAccountsChange))

        const { state: kaikasTrueState, run: updateKaikasTrueState } = useTask(
          async () => {
            const [isEnabled, isApproved, isUnlocked] = await Promise.all([
              kaikas._kaikas.isEnabled(),
              kaikas._kaikas.isApproved(),
              kaikas._kaikas.isUnlocked(),
            ])
            return { isEnabled, isApproved, isUnlocked }
          },
          { immediate: true },
        )

        useIntervalFn(updateKaikasTrueState, KAIKAS_STATE_POLL_INTERVAL)
        // usePromiseLog(kaikasTrueState, 'kaikas-true-state')

        const isKaikasTrulyEnabled = computed<boolean>(() => {
          if (kaikasTrueState.fulfilled) {
            const { value: state } = kaikasTrueState.fulfilled
            return state.isApproved && state.isEnabled && state.isUnlocked
          }
          return false
        })

        wheneverFulfilled(kaikasTrueState, () => {
          const isEnabled = isKaikasTrulyEnabled.value
          account.value = isEnabled ? kaikas.selectedAddress : null
        })

        const getChainId = () => Number(kaikas.networkVersion)
        const chainId = ref<null | number>(null)
        const isChainCorrect = computed(() => chainId.value === props.network.chainId)
        const isChainLoaded = computed(() => typeof chainId.value === 'number')
        const updateChainId = () => {
          chainId.value = getChainId()
        }

        kaikas.on('networkChanged', updateChainId)
        onScopeDispose(() => kaikas.removeListener('networkChanged', updateChainId))

        wheneverFulfilled(enableState, () => {
          account.value = kaikas.selectedAddress
          updateChainId()
        })
        wheneverRejected(enableState, () => selectWallet(null))

        const isSetupPending = toRef(enableState, 'pending')

        return reactive({
          account,
          provider: () => provider,
          isChainCorrect,
          isChainLoaded,
          enableState,
          isSetupPending,
          enable,
        })
      } else {
        const { ethereum } = wallet
        const providerFactory = () => ({ kind: 'ethers', ethers: new Web3Provider(ethereum) } as const)
        const provider = shallowRef(providerFactory())
        const updateProvider = () => {
          provider.value = providerFactory()
        }

        const { state: enableState, run: enable } = useTask(
          async () => {
            await provider.value.ethers.send('eth_requestAccounts', [])
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

        // Thanks to MetaMask - when it locks, it emits the event with an empty account list
        ethereum.on('accountsChanged', onAccountsChanged)

        onScopeDispose(() => ethereum.removeListener('accountsChanged', onAccountsChanged))

        const {
          isCorrect: isChainCorrect,
          isLoaded: isChainLoaded,
          isPending: isChainPending,
        } = useChainGuard(
          computed(() => provider.value.ethers),
          enabled,
          props.network.chainId,
        )
        ethereum.on('chainChanged', updateProvider)
        onScopeDispose(() => ethereum.removeListener('chainChanged', updateProvider))

        const { run: trySwitchNetwork, state: switchNetworkState } = useTask(async () => {
          await setupEthereumProviderNetwork(provider.value.ethers, props.network)
        })
        usePromiseLog(switchNetworkState, 'ethereum-switch-network')

        wheneverFulfilled(switchNetworkState, updateProvider)
        whenever(logicAnd(isChainLoaded, logicNot(isChainCorrect)), trySwitchNetwork, { immediate: true })

        const isSetupPending = computed(() => enableState.pending || switchNetworkState.pending || isChainPending.value)

        return reactive({
          account,
          provider: () => provider.value,
          isChainCorrect,
          isChainLoaded,
          enableState,
          isSetupPending,
          enable,
        })
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
          provider: provider(),
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
  const isEnabled = computed<boolean>(() => !!providerScope.value?.expose.account)

  const enable = () => providerScope.value?.expose.enable()

  const initialDelayActive = ref(!!selectedWallet.value)
  if (initialDelayActive.value) {
    const offInitialDelay = () => {
      initialDelayActive.value = false
    }
    useTimeoutFn(offInitialDelay, INITIAL_DELAY_TIMEOUT)
    whenever(() => !!providerScope.value?.expose.enableState.fulfilled, offInitialDelay, { immediate: true })
  }

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

    initialDelayActive,

    isEnabled,
    enable,
  }
}
