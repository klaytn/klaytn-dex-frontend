export const state = () => ({
  tokensList: [],
  selectedTokens: {
    tokenA: null,
    tokenB: null
  }
})

export const actions = {
  async getTokens({commit}) {
    const tokens = await this.$axios.$get('api/token')
    commit('SET_TOKENS', tokens)
  }
}

export const mutations = {
  SET_TOKENS(state, tokens) {
    state.tokensList = tokens
  },
  SET_SELECTED_TOKEN(state, {type, token}) {
    state.selectedTokens = {
      ...state.selectedTokens,
      [type]: token
    }
  }
}

export const getter = {
  getTokens() {

  }
}
