import { acceptHMRUpdate, defineStore } from 'pinia'

import type { AbiItem } from 'caver-js'
import kip7 from '@/utils/smartcontracts/kip-7.json'
import pairAbi from '@/utils/smartcontracts/pair.json'
import type { Address, Token } from '@/types'
import type { DexPair } from '@/types/typechain/swap'
import type { KIP7 } from '@/types/typechain/tokens'
import { useConfigWithConnectedKaikas } from '@/utils/kaikas/config'

const mockedTokens = [
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
]

interface State {
  tokensList: Token[]
  computedToken: 'tokenB' | 'tokenA' | null
  selectedTokens: {
    emptyPair: boolean
    pairAddress: Address | null
    pairBalance: string | null
    userBalance: string | null
    tokenA: Token | null
    tokenB: Token | null
  }
}

const state = (): State => ({
  tokensList: [],
  computedToken: null,
  selectedTokens: {
    emptyPair: false,
    pairAddress: null,
    pairBalance: null,
    userBalance: null,
    tokenA: null,
    tokenB: null,
  },
})

export const useTokensStore = defineStore('tokens', {
  state,
  actions: {
    async checkEmptyPair() {
      const { tokenA, tokenB } = this.selectedTokens
      if (!tokenA || !tokenB)
        return

      const pairAddress = await $kaikas.tokens.getPairAddress(
        tokenA.address,
        tokenB.address,
      )
      if ($kaikas.utils.isEmptyAddress(pairAddress)) {
        this.selectedTokens = {
          ...this.selectedTokens,
          emptyPair: true,
        }
        return
      }

      this.selectedTokens = {
        ...this.selectedTokens,
        emptyPair: false,
      }
    },
    async setSelectedTokensByPair(pairAddress: Address) {
      const config = useConfigWithConnectedKaikas()

      const pairContract = $kaikas.config.createContract<DexPair>(
        pairAddress,
        pairAbi.abi as AbiItem[],
      )

      const token0Address = await pairContract.methods.token0().call({
        from: config.address,
      })
      const token1Address = await pairContract.methods.token1().call({
        from: config.address,
      })

      const contractToken0 = $kaikas.createContract<KIP7>(
        token0Address,
        kip7.abi as AbiItem[],
      )
      const contractToken1 = $kaikas.createContract<KIP7>(
        token1Address,
        kip7.abi as AbiItem[],
      )

      const token0: Token = {
        address: token0Address,
        name: await contractToken0.methods.name().call(),
        symbol: await contractToken0.methods.symbol().call(),
        balance: await contractToken0.methods
          .balanceOf(config.address)
          .call(),
      }
      const token1: Token = {
        address: token1Address,
        name: await contractToken1.methods.name().call(),
        symbol: await contractToken1.methods.symbol().call(),
        balance: await contractToken1.methods
          .balanceOf(config.address)
          .call(),
      }
      const { pairBalance, userBalance } = await $kaikas.tokens.getPairBalance(
        token0Address,
        token1Address,
      )

      this.selectedTokens = {
        tokenA: token0,
        tokenB: token1,
        pairBalance,
        userBalance,
        emptyPair: false,
        pairAddress,
      }
    },
    async getTokens() {
      const config = useConfigWithConnectedKaikas()
      const { caver } = window

      const balance = await caver.klay.getBalance(config.address)

      const klay = {
        id: '0xae3a8a1D877a446b22249D8676AFeB16F056B44e',
        address: '0xae3a8a1D877a446b22249D8676AFeB16F056B44e',
        symbol: 'KLAY',
        name: 'Klaytn',
        logo: '-',
        slug: '-',
        balance,
      }

      const listTokens = mockedTokens.map(async (token) => {
        const contract = $kaikas.createContract<KIP7>(
          token,
          kip7.abi as AbiItem[],
        )
        const name = await contract.methods.name().call()
        const symbol = await contract.methods.symbol().call()
        const balance = await contract.methods
          .balanceOf(config.address)
          .call()

        return {
          id: token,
          name,
          symbol,
          logo: '-',
          balance,
          slug: '-',
          address: token,
        }
      })

      const resultList = await Promise.all([klay, ...listTokens])

      this.tokensList = resultList
    },

    refreshStore() {
      this.$state = state() // TODO: CHECK IT
    },

    async setCurrencyRate({ type }: { type: 'tokenB' | 'tokenA' }) {
      const token = this.selectedTokens[type]
      if (token === null)
        throw new Error('No selected tokens')

      this.selectedTokens[type] = {
        ...token,
        price: '-',
      }
    },

    setSelectedToken({ type, token }: { type: 'tokenB' | 'tokenA'; token: Token }) {
      this.selectedTokens[type] = token
    },

    setComputedToken(token: 'tokenB' | 'tokenA' | null) {
      this.computedToken = token
    },

    clearSelectedTokens() {
      this.selectedTokens = {
        emptyPair: false,
        pairAddress: null,
        pairBalance: null,
        userBalance: null,
        tokenA: null,
        tokenB: null,
      }
      return state
    },

    setTokenValue(
      { type, value, pairBalance, userBalance }:
      {
        type: 'tokenB' | 'tokenA'
        value: any
        pairBalance: string | null
        userBalance: string | null
      },
    ) {
      this.selectedTokens = {
        ...this.selectedTokens,
        pairBalance,
        userBalance,
        [type]: {
          ...this.selectedTokens[type],
          value,
        },
      }
    },
  },
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useTokensStore, import.meta.hot))
