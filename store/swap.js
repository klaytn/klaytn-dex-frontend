import kep7 from '~/utils/smartcontracts/kep-7.json'
import coinMarketCapService from '~/services/coinMarketCap'

export const state = () => ({
  tokensList: [],
  selectedTokens: {
    tokenA: null,
    tokenB: null
  }
})

export const actions = {
  async getTokens({commit}) {
    const tokens = await this.$axios.$get('api/list-tokens')

    const listTokens = tokens.map(async (token) => {

      const contract = this.$kaikas.createContract(token.address, kep7.abi)
      const name = await contract.methods.name().call()
      const symbol = await contract.methods.symbol().call()
      const balance = await contract.methods.balanceOf(token.address).call()

      const resInfo = await this.$axios.$get(coinMarketCapService.tokenInfo, {
        params: {id: token.id}
      })

      const info = resInfo.data[token.id]

      return {
        id: token.id,
        name,
        symbol,
        logo: info.logo,
        balance,
        slug: info.slug,
        address: token.address
      }
    })

    const resultList = await Promise.all(listTokens)

    const tokenAPrice = await this.$axios.$get(coinMarketCapService.currencyRate, {
      params: {id: resultList[0].id, amount: 1}
    })

    const tokenBPrice = await this.$axios.$get(coinMarketCapService.currencyRate, {
      params: {id: resultList[1].id, amount: 1}
    })

    resultList[0] = {
      ...resultList[0],
      price: tokenAPrice.data.quote.USD
    }

    resultList[1] = {
      ...resultList[1],
      price: tokenAPrice.data.quote.USD
    }

    console.log({resultList, tokenAPrice, tokenBPrice})
    commit('SET_TOKENS', resultList)
  },
  async setCurrencyRate({commit}, {id, type}) {
    const {data: {quote: {USD}}} = await this.$axios.$get(coinMarketCapService.currencyRate, {
      params: {id, amount: 1}
    })

    commit('SET_CURRENCY_RATE', {type, rate: USD})
  }
}

export const mutations = {
  SET_TOKENS(state, tokens) {
    state.tokensList = tokens
    state.selectedTokens = {
      tokenA: tokens[0],
      tokenB: tokens[1]
    }
  },
  SET_SELECTED_TOKEN(state, {type, token}) {
    state.selectedTokens = {
      ...state.selectedTokens,
      [type]: token
    }
  },
  SET_CURRENCY_RATE(state, {type, rate}) {
    state.selectedTokens = {
      ...state.selectedTokens,
      [type]: {
        ...state.selectedTokens[type],
        price: rate
      }
    }
  }
}
