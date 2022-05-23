export const state = () => ({
  exchangeRateLoading: null,
  pairNotExist: false,
  slippagePercent: 0.5,
  computedToken: null,
  exchangeRateIntervalID: null,
});

export const actions = {
  async getAmountOut({ commit, rootState: { tokens } }, value) {

    try {
      const {
        selectedTokens: { tokenA, tokenB },
      } = tokens;
      commit("SET_EMPTY_PAIR", null);

      const getAmountsOut = await this.$kaikas.tokens.getAmountOut(
        tokenA.address,
        tokenB.address,
        value
      );

      const { pairBalance, userBalance } = await this.$kaikas.tokens.getPairBalance(
        tokenA.address,
        tokenB.address
      );

      commit(
        "tokens/SET_TOKEN_VALUE",
        { type: "tokenB", value: getAmountsOut[1], pairBalance, userBalance },
        { root: true }
      );
    } catch (e) {
      console.log(e);
      this.$notify({ type: 'error', text: 'Swap error' })
    }
    return;
  },
  async getAmountIn({ commit, rootState: { tokens } }, value) {
    try {
      const {
        selectedTokens: { tokenA, tokenB },
      } = tokens;
      commit("SET_EMPTY_PAIR", null);

      const getAmountsOut = await this.$kaikas.tokens.getAmountIn(
        tokenA.address,
        tokenB.address,
        value
      );
      const { pairBalance, userBalance } = await this.$kaikas.tokens.getPairBalance(
        tokenA.address,
        tokenB.address
      );

      commit(
        "tokens/SET_TOKEN_VALUE",
        { type: "tokenA", value: getAmountsOut[0], pairBalance, userBalance },
        { root: true }
      );
    } catch (e) {
      console.log(e);
      this.$notify({ type: 'error', text: 'Get amount in error' })
    }
    return;
  },

  async swapExactTokensForTokens({ rootState: { tokens }, dispatch }) {
    try {
      const {
        selectedTokens: { tokenA, tokenB },
      } = tokens;

      const { send } = await this.$kaikas.swap.swapExactTokensForTokens({
        addressA: tokenA.address,
        addressB: tokenB.address,
        valueA: tokenA.value,
        valueB: tokenB.value,
      });

      // swapGas * 250000000000

      await send();
      this.$notify({ type: 'success', text: 'Swap success' })
      dispatch("tokens/getTokens", null, { root: true });
    } catch (e) {

      console.log(e);
      this.$notify({ type: 'error', text: 'Swap error' })
    }
    return
  },
  async swapTokensForExactTokens({ rootState: { tokens }, dispatch }) {
    try {
      const {
        selectedTokens: { tokenA, tokenB },
      } = tokens;

      const { send } = await this.$kaikas.swap.swapExactTokensForTokens({
        addressA: tokenA.address,
        addressB: tokenB.address,
        valueA: tokenA.value,
        valueB: tokenB.value,
      });

      await send();

      this.$notify({ type: "success", text: "Swap success" });

      dispatch("tokens/getTokens", null, { root: true });
    } catch (e) {
      this.$notify({ type: 'error', text: 'Swap error' })
      console.log(e);
    }
    return;
  },
};

export const mutations = {
  REFRESH_STORE(store) {
    store = state();
    return state();
  },
  SET_EXCHANGE_LOADING(state, type) {
    state.exchangeRateLoading = type;
  },
  SET_EMPTY_PAIR(state, tokens) {
    state.pairNotExist = tokens;
  },
  SET_SLIPPAGE(state, value) {
    state.slippagePercent = value;
  },
  SET_COMPUTED_TOKEN(state, token) {
    state.computedToken = token;
  },
  SET_EXCHANGE_RATE_INTERVAL_ID(state, intervalID) {
    state.exchangeRateIntervalID = intervalID;
  },
};
