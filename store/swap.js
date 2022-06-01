import config from "@/plugins/Config";
import kip7 from "@/utils/smartcontracts/kip-7.json";

export const state = () => ({
  exchangeRateLoading: null,
  pairNotExist: false,
  slippagePercent: 0.5,
  exchangeRateIntervalID: null,
});

export const actions = {
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
      const { selectedTokens, computedToken } = tokens;

      await config.approveAmount(
        selectedTokens["tokenA"].address,
        kip7.abi,
        selectedTokens["tokenA"].value
      );

      const { send } = await this.$kaikas.swap.swapExactTokensForTokens({
        addressA: selectedTokens.tokenA.address,
        addressB: selectedTokens.tokenB.address,
        valueA: selectedTokens.tokenA.value,
        valueB: selectedTokens.tokenB.value,
      });

      await send();
      this.$notify({ type: "success", text: "Swap success" });
      dispatch("tokens/getTokens", null, { root: true });
    } catch (e) {
      this.$notify({ type: "error", text: e });
    }
    return;
  },
  async swapTokensForExactTokens({ rootState: { tokens }, dispatch }) {
    try {
      const { selectedTokens, computedToken } = tokens;
      await config.approveAmount(
        selectedTokens["tokenA"].address,
        kip7.abi,
        selectedTokens["tokenA"].value
      );

      const { send } = await this.$kaikas.swap.swapExactTokensForTokens({
        addressA: selectedTokens.tokenA.address,
        addressB: selectedTokens.tokenB.address,
        valueA: selectedTokens.tokenA.value,
        valueB: selectedTokens.tokenB.value,
      });

      await send();

      this.$notify({ type: "success", text: "Swap success" });

      dispatch("tokens/getTokens", null, { root: true });
    } catch (e) {
      this.$notify({ type: "error", text: e });
    }
    return;
  },
  async swapForKlayTokens({ rootState: { tokens } }) {
    const { selectedTokens, computedToken } = tokens;

    const isComputedNativeToken = this.$kaikas.utils.isNativeToken(
      selectedTokens[computedToken].address
    );

    const inputToken =
      selectedTokens[computedToken === "tokenA" ? "tokenB" : "tokenA"];

    const computed = selectedTokens[computedToken];

    // await config.approveAmount(
    //   inputToken.address,
    //   kip7.abi,
    //   inputToken.value
    // );

    await config.approveAmount(
      selectedTokens["tokenA"].address,
      kip7.abi,
      selectedTokens["tokenA"].value
    );

    const exactTokensForEth =
      computedToken === "tokenB" && isComputedNativeToken;
    const exactETHForTokens =
      computedToken === "tokenB" && !isComputedNativeToken;
    const ETHForExactTokens =
      computedToken === "tokenA" && isComputedNativeToken;
    const tokensForExactETH =
      computedToken === "tokenA" && !isComputedNativeToken;

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
        to: inputToken.address,
        from: computed.address,
        amountOut: inputToken.value,
        amountInMax: computed.value,
      });
      await send();
    }

    this.$notify({ type: "success", text: "Swap success" });
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
