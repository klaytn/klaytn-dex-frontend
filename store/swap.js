import config from "@/plugins/Config";
import kep7 from "@/utils/smartcontracts/kep-7.json";
import pair from "@/utils/smartcontracts/pair.json";

export const state = () => ({
  exchangeRateLoading: null,
  pairNotExist: false,
  slippagePercent: 0.5,
  exchangeRateIntervalID: null,
});

export const actions = {
  async getAmountOutKlay({ commit, rootState: { tokens } }, value) {
    const { selectedTokens, computedToken } = tokens;

    let amount = null;

    const pairAddress = await this.$kaikas.config.factoryContract.methods
      .getPair(selectedTokens.tokenA.address, selectedTokens.tokenB.address)
      .call({
        from: this.address,
      });

    const pairContract = this.$kaikas.config.createContract(
      pairAddress,
      pair.abi
    );
    const token0 = await pairContract.methods.token0().call();

    const shouldReverse = token0 !== selectedTokens.tokenA.address;

    console.log({ shouldReverse });

    if (shouldReverse) {
      const [r0, r1] = await this.$kaikas.swap.getAmountOut(
        selectedTokens.tokenA.address,
        selectedTokens.tokenB.address,
        value
      );
      amount = r1;
    }

    if (!shouldReverse) {
      const [r0, r1] = await this.$kaikas.swap.getAmountIn(
        selectedTokens.tokenB.address,
        selectedTokens.tokenA.address,
        value
      );

      amount = r0;
    }

    // const [r0, r1] = await this.$kaikas.swap.getAmountOut(
    //   selectedTokens.tokenA.address,
    //   selectedTokens.tokenB.address,
    //   value
    // );
    // amount = r1;

    const { pairBalance, userBalance } =
      await this.$kaikas.tokens.getPairBalance(
        selectedTokens.tokenA.address,
        selectedTokens.tokenB.address
      );

    commit(
      "tokens/SET_TOKEN_VALUE",
      { type: "tokenB", value: amount, pairBalance, userBalance },
      { root: true }
    );
  },
  async getAmountInKlay({ commit, rootState: { tokens } }, value) {
    const { selectedTokens } = tokens;

    let amount = null;

    const pairAddress = await this.$kaikas.config.factoryContract.methods
      .getPair(selectedTokens.tokenA.address, selectedTokens.tokenB.address)
      .call({
        from: this.address,
      });

    const pairContract = this.$kaikas.config.createContract(
      pairAddress,
      pair.abi
    );
    const token0 = await pairContract.methods.token0().call();
    const shouldReverse = token0 !== selectedTokens.tokenA.address;

    if (shouldReverse) {
      const [r0, r1] = await this.$kaikas.swap.getAmountOut(
        selectedTokens.tokenB.address,
        selectedTokens.tokenA.address,
        value
      );

      amount = r1;
    }

    if (!shouldReverse) {
      const [r0, r1] = await this.$kaikas.swap.getAmountIn(
        selectedTokens.tokenA.address,
        selectedTokens.tokenB.address,
        value
      );

      amount = r0;
    }

    // const [r0] = await this.$kaikas.swap.getAmountIn(
    //   selectedTokens.tokenA.address,
    //   selectedTokens.tokenB.address,
    //   value
    // );
    // amount = r0;

    const { pairBalance, userBalance } =
      await this.$kaikas.tokens.getPairBalance(
        selectedTokens.tokenA.address,
        selectedTokens.tokenB.address
      );

    commit(
      "tokens/SET_TOKEN_VALUE",
      { type: "tokenA", value: amount, pairBalance, userBalance },
      { root: true }
    );
  },
  async getAmountOut({ commit, rootState: { tokens } }, value) {
    const {
      selectedTokens: { tokenA, tokenB },
    } = tokens;
    const amountOut = await this.$kaikas.swap.getAmountOut(
      tokenA.address,
      tokenB.address,
      value
    );

    const { pairBalance, userBalance } =
      await this.$kaikas.tokens.getPairBalance(tokenA.address, tokenB.address);

    commit(
      "tokens/SET_TOKEN_VALUE",
      { type: "tokenB", value: amountOut[1], pairBalance, userBalance },
      { root: true }
    );
  },
  async getAmountIn({ commit, rootState: { tokens } }, value) {
    const {
      selectedTokens: { tokenA, tokenB },
    } = tokens;

    const amountIn = await this.$kaikas.swap.getAmountIn(
      tokenA.address,
      tokenB.address,
      value
    );

    const { pairBalance, userBalance } =
      await this.$kaikas.tokens.getPairBalance(tokenA.address, tokenB.address);

    commit(
      "tokens/SET_TOKEN_VALUE",
      { type: "tokenA", value: amountIn[0], pairBalance, userBalance },
      { root: true }
    );
  },
  async swapExactTokensForTokens({ rootState: { tokens }, dispatch }) {
    try {
      const {
        selectedTokens: { tokenA, tokenB },
      } = tokens;
      await config.approveAmount(tokenA.address, kep7.abi, tokenA.value);

      await config.approveAmount(tokenB.address, kep7.abi, tokenB.value);

      const { send } = await this.$kaikas.swap.swapExactTokensForTokens({
        addressA: tokenA.address,
        addressB: tokenB.address,
        valueA: tokenA.value,
        valueB: tokenB.value,
      });

      // swapGas * 250000000000

      await send();
      this.$notify({ type: "success", text: "Swap success" });
      dispatch("tokens/getTokens", null, { root: true });
    } catch (e) {
      console.log(e);
      this.$notify({ type: "error", text: "Swap error" });
    }
    return;
  },
  async swapTokensForExactTokens({ rootState: { tokens }, dispatch }) {
    try {
      const {
        selectedTokens: { tokenA, tokenB },
      } = tokens;

      await config.approveAmount(tokenA.address, kep7.abi, tokenA.value);
      await config.approveAmount(tokenB.address, kep7.abi, tokenB.value);

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
      this.$notify({ type: "error", text: "Swap error" });
      console.log(e);
    }
    return;
  },
  async swapForKlayTokens({ rootState: { tokens }, dispatch }) {
    const { selectedTokens, computedToken } = tokens;

    await config.approveAmount(
      selectedTokens.tokenA.address,
      kep7.abi,
      selectedTokens.tokenA.value
    );

    await config.approveAmount(
      selectedTokens.tokenB.address,
      kep7.abi,
      selectedTokens.tokenB.value
    );

    const isComputedNativeToken = this.$kaikas.utils.isNativeToken(
      selectedTokens[computedToken].address
    );

    const inputToken =
      selectedTokens[computedToken === "tokenA" ? "tokenB" : "tokenA"];

    const computed = selectedTokens[computedToken];

    const exactTokensForEth =
      computedToken === "tokenB" && isComputedNativeToken;
    const exactETHForTokens =
      computedToken === "tokenB" && !isComputedNativeToken;

    const ETHForExactTokens =
      computedToken === "tokenA" && isComputedNativeToken;
    const tokensForExactETH =
      computedToken === "tokenA" && !isComputedNativeToken;

    debugger;

    if (exactTokensForEth) {
      const { send } = await this.$kaikas.swap.swapExactTokensForETH({
        addressA: selectedTokens[computedToken].address,
        addressB: inputToken.address,
        valueA: selectedTokens[computedToken].value,
        valueB: inputToken.value,
      });
      await send();
    }

    if (exactETHForTokens) {
      const { send } = await this.$kaikas.swap.swapExactETHForTokens({
        addressA: selectedTokens[computedToken].address,
        valueA: selectedTokens[computedToken].value,
        addressB: inputToken.address,
        valueB: inputToken.value,
      });
      await send();
    }

    if (ETHForExactTokens) {
      const { send } = await this.$kaikas.swap.swapEthForExactTokens({
        to: computed.address,
        from: inputToken.address,
        amountOut: computed.value,
        amountIn: inputToken.value,
      });
      await send();
    }

    if (tokensForExactETH) {
      const { send } = await this.$kaikas.swap.swapTokensForExactETH({
        to: inputToken.address, //klay
        from: computed.address,
        amountOut: inputToken.value, //klay
        amountInMax: computed.value,
      });
      await send();
    }

    //
    // await send();
    //
    // this.$notify({ type: "success", text: "Swap success" });
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
