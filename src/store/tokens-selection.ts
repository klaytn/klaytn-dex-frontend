import { acceptHMRUpdate, defineStore } from 'pinia'
import { Address, Balance, isEmptyAddress, Token } from '@/core/kaikas'
import type { DexPair } from '@/types/typechain/swap'
import { PAIR as PAIR_ABI } from '@/core/kaikas/smartcontracts/abi'
import invariant from 'tiny-invariant'
import { Task, useDanglingScope, useTask } from '@vue-kakuyaku/core'
import { Ref } from 'vue'

type TokenType = `token${'A' | 'B'}`

interface TokenAddressAndValue {
  addr: Address
  /**
   * FIXME some value in token units?
   */
  value: string
}

interface Selection {
  tokenA: null | TokenAddressAndValue
  tokenB: null | TokenAddressAndValue
}

interface PairData {
  addr: Address
  isEmpty: boolean
}

export const useTokensSelectionStore = defineStore('tokens-selection', () => {
  const kaikasStore = useKaikasStore()
  const tokensStore = useTokensStore()

  const lastTouched = ref<null | TokenType>(null)

  const selection = reactive<Selection>({
    tokenA: null,
    tokenB: null,
  })

  function tryResolveToken(type: TokenType): null | Token {
    const tokens = tokensStore.tokens as Token[]
    const addr = selection[type]?.addr
    if (!tokens || !addr) return null
    return tokens.find((x) => x.address === addr) ?? null
  }

  const selectionResolvedTokens = reactive({
    tokenA: computed(() => tryResolveToken('tokenA')),
    tokenB: computed(() => tryResolveToken('tokenB')),
  })

  const computePairBySelectionTaskScope = useDanglingScope<{
    tokenA: Address
    tokenB: Address
    pair: Ref<PairData | null>
    task: Task<Address>
  }>()

  function computePairBySelection() {
    const kaikas = kaikasStore.getKaikasAnyway()
    invariant(selection.tokenA && selection.tokenB)
    const {
      tokenA: { addr: tokenA },
      tokenB: { addr: tokenB },
    } = selection

    computePairBySelectionTaskScope.setup(() => {
      const task = useTask(() => kaikas.tokens.getPairAddress(tokenA, tokenB))
      task.run()

      const pair = computed(() => {
        const state = task.state
        if (state.kind === 'ok') {
          const addr = state.data
          const isEmpty = isEmptyAddress(addr)
          return { addr, isEmpty }
        }
        return null
      })

      return { task, tokenA, tokenB, pair }
    })
  }

  const computedPairBySelection = computed<null | PairData>(() => {
    return computePairBySelectionTaskScope.scope.value?.setup.pair.value ?? null
  })

  // async function checkEmptyPair() {
  //   const { tokenA, tokenB } = state.selectedTokens
  //   if (!tokenA || !tokenB) return

  //   const kaikas = kaikasStore.getKaikasAnyway()

  //   const pairAddress = await kaikas.tokens.getPairAddress(tokenA.address, tokenB.address)
  //   if (isEmptyAddress(pairAddress)) {
  //     state.selectedTokens.emptyPair = true
  //     return
  //   }

  //   state.selectedTokens.emptyPair = false
  // }

  const computeSelectionByPairTaskScope = useDanglingScope<{
    pairAddr: Address
    /**
     * FIXME question: should we create tokens, or should we assume
     * that they are already persisted in the tokens store?
     */
    data: Ref<null | {
      token0: Address
      token1: Address
      userBalance: Balance
      pairBalance: Balance
    }>
  }>()

  function computeSelectionByPair(pairAddr: Address) {
    computePairBySelectionTaskScope.dispose()

    const kaikas = kaikasStore.getKaikasAnyway()
    const pairContract = kaikas.cfg.createContract<DexPair>(pairAddr, PAIR_ABI)

    computeSelectionByPairTaskScope.setup(() => {
      const task = useTask(async () => {
        const [token0, token1] = (await Promise.all([
          pairContract.methods.token0().call(),
          pairContract.methods.token1().call(),
        ])) as [Address, Address]

        // should it be here?
        const { pairBalance, userBalance } = await kaikas.tokens.getPairBalance(token0, token1)

        return { token0, token1, pairBalance, userBalance }
      })

      const data = computed(() => {
        return task.state.kind === 'ok' ? task.state.data : null
      })

      return { pairAddr, data }
    })
  }

  const computedSelectionByPair = computed(() => computeSelectionByPairTaskScope.scope.value?.setup.data.value ?? null)

  // async function setSelectedTokensByPair(pairAddress: Address) {
  //   const kaikas = kaikasStore.getKaikasAnyway()
  //   const addr = kaikas.cfg.addrs.self

  //   const pairContract = kaikas.cfg.createContract<DexPair>(pairAddress, PAIR_ABI)

  //   const token0Address = (await pairContract.methods.token0().call({
  //     from: addr,
  //   })) as Address
  //   const token1Address = (await pairContract.methods.token1().call({
  //     from: addr,
  //   })) as Address

  //   const [token0, token1] = await Promise.all([kaikas.createToken(token0Address), kaikas.createToken(token1Address)])

  //   const { pairBalance, userBalance } = await kaikas.tokens.getPairBalance(token0Address, token1Address)

  //   state.selectedTokens = {
  //     tokenA: token0,
  //     tokenB: token1,
  //     pairBalance,
  //     userBalance,
  //     emptyPair: false,
  //     pairAddress,
  //   }
  // }

  // function setSelectedToken({ type, token }: { type: 'tokenB' | 'tokenA'; token: Token }) {
  //   state.selectedTokens[type] = token
  // }

  // function setComputedToken(token: 'tokenB' | 'tokenA' | null) {
  //   state.computedToken = token
  // }

  // function clearSelectedTokens() {
  //   state.selectedTokens = selectedTokensFactory()
  // }

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
    selection,
    lastTouched,

    selectionResolvedTokens,

    computeSelectionByPair,
    computePairBySelection,
  }
})

import.meta.hot?.accept(acceptHMRUpdate(useTokensSelectionStore, import.meta.hot))
