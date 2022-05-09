import kep7 from "~/utils/smartcontracts/kep-7.json";
import pair from "~/utils/smartcontracts/pair.json";

export const state = () => ({
  exchangeRateLoading: null,
  pairNotExist: false,
  slippagePercent: 0.5,
  computedToken: null,
  exchangeRateIntervalID: null,
});

export const actions = {
  async getAmountOut({ commit, rootState: { tokens } }, value) {
    const {
      selectedTokens: { tokenA, tokenB },
    } = tokens;

    commit("SET_EMPTY_PAIR", null);

    try {
      const pairAddress = await this.$kaikas.factoryContract.methods
        .getPair(tokenA.address, tokenB.address)
        .call({
          from: this.$kaikas.address,
        });

      if (this.$kaikas.isEmptyAddress(pairAddress)) {
        commit("SET_EMPTY_PAIR", [tokenA.address, tokenB.address]);
        return;
      }

      const pairContract = this.$kaikas.createContract(pairAddress, pair.abi);
      const reserves = await pairContract.methods.getReserves().call({
        from: this.$kaikas.address,
      });

      const getAmountOut = await this.$kaikas.routerContract.methods
        .getAmountOut(value, reserves[0], reserves[1])
        .call({
          from: this.$kaikas.address,
        });

      commit(
        "tokens/SET_TOKEN_VALUE",
        { type: "tokenB", value: getAmountOut },
        { root: true }
      );
    } catch (e) {
      console.log(e);
    }

    return
  },
  async getAmountIn({ commit, rootState: { tokens } }, value) {
    const {
      selectedTokens: { tokenA, tokenB },
    } = tokens;

    commit("SET_EMPTY_PAIR", null);

    try {
      const pairAddress = await this.$kaikas.factoryContract.methods
        .getPair(tokenA.address, tokenB.address)
        .call({
          from: this.$kaikas.address,
        });

      if (this.$kaikas.isEmptyAddress(pairAddress)) {
        commit("SET_EMPTY_PAIR", [tokenA.address, tokenB.address]);
        return;
      }

      const pairContract = this.$kaikas.createContract(pairAddress, pair.abi);

      const reserves = await pairContract.methods.getReserves().call({
        from: this.$kaikas.address,
      });


      const getAmountIn = await this.$kaikas.routerContract.methods
        .getAmountIn(value, reserves[0], reserves[1])
        .call({
          from: this.$kaikas.address,
        });

      commit(
        "tokens/SET_TOKEN_VALUE",
        { type: "tokenA", value: getAmountIn },
        { root: true }
      );
    } catch (e) {
      console.log(e);
    }

    return
  },
  async swapExactTokensForTokens({ rootState: { tokens }, dispatch }) {
    try {
      const {
        selectedTokens: { tokenA, tokenB },
      } = tokens;

      await this.$kaikas.approveAmount(tokenA.address, kep7.abi, tokenA.value);

      const deadLine = Math.floor(Date.now() / 1000 + 3000);

      const swapGas = await this.$kaikas.routerContract.methods
        .swapExactTokensForTokens(
          tokenA.value,
          tokenB.value,
          [tokenA.address, tokenB.address],
          this.$kaikas.address,
          deadLine
        )
        .estimateGas();

      await this.$kaikas.routerContract.methods
        .swapExactTokensForTokens(
          tokenA.value,
          tokenB.value,
          [tokenA.address, tokenB.address],
          this.$kaikas.address,
          deadLine
        )
        .send({
          from: this.$kaikas.address,
          gas: swapGas,
          gasPrice: 750000000000,
        });

      dispatch("tokens/getTokens", null, {root: true});


      console.log("SWAP SUCCESS");
    } catch (e) {
      console.log(e);
    }
  },
  async swapTokensForExactTokens({ rootState: { tokens }, dispatch }) {
    try {
      const {
        selectedTokens: { tokenA, tokenB },
      } = tokens;

      await this.$kaikas.approveAmount(tokenB.address, kep7.abi, tokenB.value);

      const deadLine = Math.floor(Date.now() / 1000 + 3000);
      const swapGas = await this.$kaikas.routerContract.methods
        .swapTokensForExactTokens(
          tokenB.value,
          tokenA.value,
          [tokenB.address, tokenA.address],
          this.$kaikas.address,
          deadLine
        )
        .estimateGas();

      await this.$kaikas.routerContract.methods
        .swapTokensForExactTokens(
          tokenB.value,
          tokenA.value,
          [tokenB.address, tokenA.address],
          this.$kaikas.address,
          deadLine
        )
        .send({
          from: this.$kaikas.address,
          gas: swapGas,
          gasPrice: 750000000000,
        });

      // const updatedList = await Promise.all(
      //   tokensList.map(async ({ address, ...props }) => {
      //     const contract = this.$kaikas.createContract(address, kep7.abi);
      //     const balance = await contract.methods
      //       .balanceOf(this.$kaikas.address)
      //       .call();
      //
      //     return {
      //       ...props,
      //       balance,
      //     };
      //   })
      // );
      //
      // console.log(updatedList);
      //
      // commit("SET_TOKENS", updatedList);
      dispatch("tokens/getTokens", null, {root: true});
    } catch (e) {
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
  SET_CURRENCY_RATE(state, { type, rate }) {
    state.selectedTokens = {
      ...state.selectedTokens,
      [type]: {
        ...state.selectedTokens[type],
        price: rate,
      },
    };
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
