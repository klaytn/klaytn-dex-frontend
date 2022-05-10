import kep7 from "~/utils/smartcontracts/kep-7.json";
import coinMarketCapService from "~/services/coinMarketCap";

export const state = () => ({
  tokensList: [],
  selectedTokens: {
    pairBalance: null,
    tokenA: null,
    tokenB: null,
  },
});

export const actions = {
  async getTokens({ commit }) {
    const tokens = await this.$axios.$get("api/list-tokens");

    const listTokens = tokens.map(async (token) => {
      const contract = this.$kaikas.createContract(token.address, kep7.abi);
      const name = await contract.methods.name().call();
      const symbol = await contract.methods.symbol().call();
      const balance = await contract.methods
        .balanceOf(this.$kaikas.address)
        .call();

      const resInfo = await this.$axios.$get(coinMarketCapService.tokenInfo, {
        params: { id: token.id },
      });

      const info = resInfo.data[token.id];

      return {
        id: token.id,
        name,
        symbol,
        logo: info.logo,
        balance,
        slug: info.slug,
        address: token.address,
      };
    });

    const resultList = await Promise.all(listTokens);

    commit("SET_TOKENS", resultList);
  },
  async setCurrencyRate({ commit }, { id, type }) {
    const {
      data: {
        quote: { USD },
      },
    } = await this.$axios.$get(coinMarketCapService.currencyRate, {
      params: { id, amount: 1 },
    });

    commit("SET_CURRENCY_RATE", { type, rate: USD });
  },
};

export const mutations = {
  REFRESH_STORE(store) {
    store = state();
    return state();
  },
  SET_TOKENS(state, tokens) {
    state.tokensList = tokens;
  },
  CLEAR_SELECTED_TOKENS(state) {
    state.selectedTokens = {
      pairBalance: null,
      tokenA: null,
      tokenB: null,
    };
    return state;
  },
  SET_SELECTED_TOKEN(state, { type, token }) {
    state.selectedTokens[type] = token;
  },
  SET_CURRENCY_RATE(state, { type, rate }) {
    state.selectedTokens[type] = {
      ...state.selectedTokens[type],
      price: rate,
    };
  },
  SET_TOKEN_VALUE(state, { type, value, pairBalance, userBalance }) {
    state.selectedTokens[type].value = value;
    state.selectedTokens.pairBalance = pairBalance;
    state.selectedTokens.userBalance = userBalance;

  },
};
