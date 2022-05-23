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

const mockedTokens = [
  "0xb9920BD871e39C6EF46169c32e7AC4C698688881",
  "0x1CDcD477994e86A11E21C27ca907bEA266EA3A0a",
  "0x2486A551714F947C386Fe9c8b895C2A6b3275EC9",
  "0xAFea7569B745EaE7AB22cF17c3B237c3350407A1",
  "0xC20A9eB22de0C6920619aDe93A11283C2a07273e",
  "0xce77229fF8451f5791ef4Cc2a841735Ed4edc3cA",
  "0xFbcb69f52D6A08C156c543Dd4Dc0521F5F545755",
  "0x7cB550723972d7F29b047D6e71b62DcCcAF93992",
  "0xcdBD333BDBB99bC80D77B10CCF74285a97150E5d",
  "0x246C989333Fa3C3247C7171F6bca68062172992C",
];

export const actions = {
  async getTokens({ commit }) {
    const balance = await caver.klay.getBalance(this.$kaikas.config.address);

    const klay = {
      id: "0xae3a8a1D877a446b22249D8676AFeB16F056B44e",
      address: "0xae3a8a1D877a446b22249D8676AFeB16F056B44e",
      symbol: "KLAY",
      name: "Klaytn",
      logo: "-",
      slug: "-",
      balance,
    };

    const listTokens = mockedTokens.map(async (token) => {
      const contract = this.$kaikas.createContract(token, kep7.abi);
      const name = await contract.methods.name().call();
      const symbol = await contract.methods.symbol().call();
      const balance = await contract.methods
        .balanceOf(this.$kaikas.config.address)
        .call();

      return {
        id: token,
        name,
        symbol,
        logo: "-",
        balance,
        slug: "-",
        address: token,
      };
    });

    const resultList = await Promise.all([klay, ...listTokens]);

    commit("SET_TOKENS", resultList);
  },
  async setCurrencyRate({ commit }, { id, type }) {
    commit("SET_CURRENCY_RATE", { type, rate: "-" });
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
    state.selectedTokens = {
      ...state.selectedTokens,
      pairBalance,
      userBalance,
      [type]: {
        ...state.selectedTokens[type],
        value,
      },
    };
  },
};
