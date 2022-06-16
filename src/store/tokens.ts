import { acceptHMRUpdate, defineStore } from 'pinia'

import kip7 from '@/utils/smartcontracts/kip-7.json'
import pairAbi from '@/utils/smartcontracts/pair.json'

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

const state = () => ({
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
    async setSelectedTokensByPair(pairAddress) {
      const pairContract = $kaikas.config.createContract(
        pairAddress,
        pairAbi.abi,
      )
      const pair = {}
      const token0Address = await pairContract.methods.token0().call({
        from: $kaikas.config.address,
      })
      const token1Address = await pairContract.methods.token1().call({
        from: $kaikas.config.address,
      })

      const token0 = {}
      const token1 = {}

      const contractToken0 = $kaikas.createContract(token0Address, kip7.abi)
      const contractToken1 = $kaikas.createContract(token1Address, kip7.abi)

      token0.address = token0Address
      token0.name = await contractToken0.methods.name().call()
      token0.symbol = await contractToken0.methods.symbol().call()
      token0.balance = await contractToken0.methods
        .balanceOf($kaikas.config.address)
        .call()

      token1.address = token1Address
      token1.name = await contractToken1.methods.name().call()
      token1.symbol = await contractToken1.methods.symbol().call()
      token1.balance = await contractToken1.methods
        .balanceOf($kaikas.config.address)
        .call()

      pair.tokenA = token0
      pair.tokenB = token1

      const { pairBalance, userBalance } = await $kaikas.tokens.getPairBalance(
        token0Address,
        token1Address,
      )

      pair.pairBalance = pairBalance
      pair.userBalance = userBalance
      pair.emptyPair = false
      pair.pairAddress = pairAddress

      this.selectedTokens = { ...pair }
    },
    async getTokens() {
      const balance = await caver.klay.getBalance($kaikas.config.address)

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
        const contract = $kaikas.createContract(token, kip7.abi)
        const name = await contract.methods.name().call()
        const symbol = await contract.methods.symbol().call()
        const balance = await contract.methods
          .balanceOf($kaikas.config.address)
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

    async setCurrencyRate({ id, type }) {
      this.selectedTokens[type] = {
        ...this.selectedTokens[type],
        price: '-',
      }
    },

    setSelectedToken({ type, token }) {
      this.selectedTokens[type] = token
    },

    setComputedToken(token) {
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

    setTokenValue({ type, value, pairBalance, userBalance }) {
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
