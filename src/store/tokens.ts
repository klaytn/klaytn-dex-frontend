import { acceptHMRUpdate, defineStore } from 'pinia'
import type { AbiItem } from 'caver-js'
import { Address, Balance, isEmptyAddress, Kaikas, Token } from '@/core/kaikas'
import type { DexPair } from '@/types/typechain/swap'
import type { KIP7 } from '@/types/typechain/tokens'
import { abi as KIP7_ABI_RAW } from '@/core/kaikas/smartcontracts/kip-7.json'
import { abi as PAIR_ABI_RAW } from '@/core/kaikas/smartcontracts/pair.json'
import invariant from 'tiny-invariant'

const KIP7_ABI = KIP7_ABI_RAW as AbiItem[]
const PAIR_ABI = PAIR_ABI_RAW as AbiItem[]

/**
 * What does it mean?
 */
const MOCKED_TOKENS = [
  '0xb9920BD871e39C6EF46169c32e7AC4C698688881',
  '0x1CDcD477994e86A11E21C27ca907bEA266EA3A0a',
  '0x2486A551714F947C386Fe9c8b895C2A6b3275EC9',
  '0xAFea7569B745EaE7AB22cF17c3B237c3350407A1',
  '0xC20A9eB22de0C6920619aDe93A11283C2a07273e',
  '0xce77229fF8451f5791ef4Cc2a841735Ed4edc3cA',
  '0xFbcb69f52D6A08C156c543Dd4Dc0521F5F545755',
  '0x7cB550723972d7F29b047D6e71b62DcCcAF93992',
  '0xcdBD333BDBB99bC80D77B10CCF74285a97150E5d',
  '0x246C989333Fa3C3247C7171F6bca68062172992C',
] as Address[]

function createKlayToken(klayBalance: Balance): Token {
  return {
    address: '0xae3a8a1D877a446b22249D8676AFeB16F056B44e' as Address,
    symbol: 'KLAY',
    name: 'Klaytn',
    balance: klayBalance,
  }
}

interface State {
  tokensList: Token[]
  /**
   * FIXME what does it mean?
   */
  computedToken: 'tokenB' | 'tokenA' | null
  selectedTokens: SelectedTokens
}

interface SelectedTokens {
  emptyPair: boolean
  pairAddress: Address | null
  pairBalance: string | null
  userBalance: string | null
  tokenA: Token | null
  tokenB: Token | null
}

const stateFactory = (): State => ({
  tokensList: [],
  computedToken: null,
  selectedTokens: selectedTokensFactory(),
})

const selectedTokensFactory = (): SelectedTokens => ({
  emptyPair: false,
  pairAddress: null,
  pairBalance: null,
  userBalance: null,
  tokenA: null,
  tokenB: null,
})

async function createToken(kaikas: Kaikas, addr: Address): Promise<Token> {
  const contract = kaikas.cfg.createContract<KIP7>(addr, KIP7_ABI)
  return {
    // id: addr,
    address: addr,

    // FIXME Promise.all
    name: await contract.methods.name().call(),
    symbol: await contract.methods.symbol().call(),
    balance: (await contract.methods.balanceOf(addr).call()) as Balance,
  }
}

/**
 * What is this store for?
 */
export const useTokensStore = defineStore('tokens', () => {
  const kaikasStore = useKaikasStore()

  const state = reactive(stateFactory())

  async function checkEmptyPair() {
    const { tokenA, tokenB } = state.selectedTokens
    if (!tokenA || !tokenB) return

    const kaikas = kaikasStore.getKaikasAnyway()

    const pairAddress = await kaikas.tokens.getPairAddress(tokenA.address, tokenB.address)
    if (isEmptyAddress(pairAddress)) {
      state.selectedTokens.emptyPair = true
      return
    }

    state.selectedTokens.emptyPair = false
  }

  async function setSelectedTokensByPair(pairAddress: Address) {
    const kaikas = kaikasStore.getKaikasAnyway()
    const addr = kaikas.cfg.addrs.self

    const pairContract = kaikas.cfg.createContract<DexPair>(pairAddress, PAIR_ABI)

    const token0Address = (await pairContract.methods.token0().call({
      from: addr,
    })) as Address
    const token1Address = (await pairContract.methods.token1().call({
      from: addr,
    })) as Address

    const [token0, token1] = await Promise.all([createToken(kaikas, token0Address), createToken(kaikas, token1Address)])

    const { pairBalance, userBalance } = await kaikas.tokens.getPairBalance(token0Address, token1Address)

    state.selectedTokens = {
      tokenA: token0,
      tokenB: token1,
      pairBalance,
      userBalance,
      emptyPair: false,
      pairAddress,
    }
  }

  function setCurrencyRate({ type }: { type: 'tokenB' | 'tokenA' }) {
    const token = state.selectedTokens[type]
    if (token === null) throw new Error('No selected tokens')

    state.selectedTokens[type] = {
      ...token,

      // FIXME add type semantics
      price: '-',
    }
  }

  async function getTokens() {
    const kaikas = kaikasStore.getKaikasAnyway()
    const {
      caver,
      addrs: { self: selfAddr },
    } = kaikas.cfg

    const balance = (await caver.klay.getBalance(selfAddr)) as Balance
    const klay = createKlayToken(balance)

    const mockedTokens = await Promise.all(MOCKED_TOKENS.map((addr) => createToken(kaikas, addr)))

    state.tokensList = [klay, ...mockedTokens]
  }

  function setSelectedToken({ type, token }: { type: 'tokenB' | 'tokenA'; token: Token }) {
    state.selectedTokens[type] = token
  }

  function setComputedToken(token: 'tokenB' | 'tokenA' | null) {
    state.computedToken = token
  }

  function clearSelectedTokens() {
    state.selectedTokens = selectedTokensFactory()
  }

  function setTokenValue({
    type,
    value,
    pairBalance,
    userBalance,
  }: {
    type: 'tokenB' | 'tokenA'
    value: any
    pairBalance: string | null
    userBalance: string | null
  }) {
    state.selectedTokens = {
      ...state.selectedTokens,
      pairBalance,
      userBalance,
      [type]: {
        ...state.selectedTokens[type],
        value,
      },
    }
  }

  /**
   * Fails if there are no selected tokens
   */
  function getSelectedTokensAnyway(): { tokenA: Token; tokenB: Token } {
    const { tokenA, tokenB } = state.selectedTokens
    invariant(tokenA && tokenB, 'No selected tokens')
    return { tokenA, tokenB }
  }

  /**
   * Fails if there are no selected tokens or pair address
   */
  function getSelectedTokensAndPairAnyway(): ReturnType<typeof getSelectedTokensAnyway> & { pairAddress: Address } {
    const { pairAddress } = state.selectedTokens
    invariant(pairAddress, 'No selected pair address')
    return { pairAddress, ...getSelectedTokensAnyway() }
  }

  return {
    state,
    getTokens,
    clearSelectedTokens,
    setTokenValue,
    setSelectedToken,
    setComputedToken,
    setCurrencyRate,
    setSelectedTokensByPair,
    checkEmptyPair,

    getSelectedTokensAnyway,
    getSelectedTokensAndPairAnyway,
  }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useTokensStore, import.meta.hot))
