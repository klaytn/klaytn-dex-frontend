import kep7 from "@/utils/smartcontracts/kep-7.json";
import pairAbi from "@/utils/smartcontracts/pair.json";
import config from "@/plugins/Config";

export const state = () => ({
  liquidityStatus: "init",
  pairs: [],
});

export const actions = {
  async quoteForTokenB({ commit, rootState: { tokens } }, value) {
    try {
      const {
        selectedTokens: { tokenA, tokenB },
        computedToken,
      } = tokens;

      const exchangeRate = await this.$kaikas.tokens.getTokenBQuote(
        tokenA.address,
        tokenB.address,
        value
      );

      const { pairBalance, userBalance } =
        await this.$kaikas.tokens.getPairBalance(
          tokenA.address,
          tokenB.address
        );

      commit(
        "tokens/SET_TOKEN_VALUE",
        { type: computedToken, value: exchangeRate, pairBalance, userBalance },
        { root: true }
      );
    } catch (e) {
      console.log(e);
      this.$notify({ type: "error", text: e });
    }
    return;
  },
  async quoteForTokenA({ commit, rootState: { tokens } }, value) {
    try {
      const {
        selectedTokens: { tokenA, tokenB },
        computedToken,
      } = tokens;

      const exchangeRate = await this.$kaikas.tokens.getTokenAQuote(
        tokenA.address,
        tokenB.address,
        value
      );

      const { pairBalance, userBalance } =
        await this.$kaikas.tokens.getPairBalance(
          tokenA.address,
          tokenB.address
        );

      commit(
        "tokens/SET_TOKEN_VALUE",
        { type: computedToken, value: exchangeRate, pairBalance, userBalance },
        { root: true }
      );
    } catch (e) {
      console.log(e);
      this.$notify({ type: "error", text: e });
    }
    return;
  },
  async quoteForKlay({ commit, rootState: { tokens } }, { value, reversed }) {
    try {
      const {
        selectedTokens: { tokenA, tokenB },
        computedToken,
      } = tokens;

      const exchangeRate = await this.$kaikas.tokens.getKlayQuote(
        tokenA.address,
        tokenB.address,
        value,
        reversed
      );

      const { pairBalance, userBalance } =
        await this.$kaikas.tokens.getPairBalance(
          tokenA.address,
          tokenB.address
        );

      commit(
        "tokens/SET_TOKEN_VALUE",
        { type: computedToken, value: exchangeRate, pairBalance, userBalance },
        { root: true }
      );
    } catch (e) {
      console.log(e);
      this.$notify({ type: "error", text: e });
    }
    return;
  },
  async getPairs({ commit }) {
    const pairsCount = await this.$kaikas.config.factoryContract.methods
      .allPairsLength()
      .call();

    const pairs = await Promise.all(
      new Array(Number(pairsCount)).fill(null).map(async (it, i) => {
        let pair = {};

        const address = await this.$kaikas.config.factoryContract.methods
          .allPairs(i)
          .call();

        const contract = this.$kaikas.config.createContract(
          address,
          pairAbi.abi
        );

        const addressA = await contract.methods.token0().call();
        const addressB = await contract.methods.token1().call();

        const contractA = this.$kaikas.config.createContract(
          addressA,
          kep7.abi
        );
        const contractB = this.$kaikas.config.createContract(
          addressB,
          kep7.abi
        );

        let name = await contract.methods.name().call();
        let symbol = await contract.methods.symbol().call();

        if (
          !this.$kaikas.utils.isEmptyAddress(addressA) &&
          !this.$kaikas.utils.isEmptyAddress(addressB)
        ) {
          const symbolA = await contractA.methods.symbol().call();
          const symbolB = await contractB.methods.symbol().call();

          name = `${symbolA} - ${symbolB}`;

          pair.symbolA = symbolA;
          pair.symbolB = symbolB;
        }

        const pairBalance = await contract.methods.totalSupply().call();
        const userBalance = await contract.methods
          .balanceOf(this.$kaikas.config.address)
          .call();

        const reserves = await contract.methods.getReserves().call();

        return {
          ...pair,
          userBalance,
          pairBalance,
          symbol,
          name,
          reserves,
        };
      })
    );

    commit("SET_PAIRS", pairs);
  },

  async addLiquidityAmountOut({ rootState: { tokens } }) {
    const {
      selectedTokens: { tokenA, tokenB },
    } = tokens;
    try {
      const tokenAValue = this.$kaikas.bigNumber(tokenA.value);
      const tokenBValue = this.$kaikas.bigNumber(tokenB.value);
      const deadLine = Math.floor(Date.now() / 1000 + 300);
      const amountAMin = tokenAValue.minus(tokenAValue.dividedToIntegerBy(100));
      const amountBMin = tokenBValue.minus(tokenBValue.dividedToIntegerBy(100));

      await this.$kaikas.config.approveAmount(
        tokenA.address,
        kep7.abi,
        tokenAValue.toFixed(0)
      );

      await this.$kaikas.config.approveAmount(
        tokenB.address,
        kep7.abi,
        tokenBValue.toFixed(0)
      );
      const pairAddress = await this.$kaikas.config.factoryContract.methods
        .getPair(tokenA.address, tokenB.address)
        .call({
          from: this.address,
        });

      if (!this.$kaikas.isEmptyAddress(pairAddress)) {
        const { gas, send } =
          await this.$kaikas.liquidity.addLiquidityAmountOutForExistPair({
            pairAddress,
            tokenAValue,
            tokenBValue,
            tokenAddressA: tokenA.address,
            tokenAddressB: tokenB.address,
            amountAMin,
            deadLine,
          });

        await send();
        this.$notify({ type: "success", text: "Liquidity success" });

        console.log("addLiquidityAmountOutForExistPair ", gas);
        return;
      }

      const lqGas = await this.$kaikas.config.routerContract.methods
        .addLiquidity(
          tokenA.address,
          tokenB.address,
          tokenAValue.toFixed(0),
          tokenBValue.toFixed(0),
          amountAMin.toFixed(0),
          amountBMin.toFixed(0),
          this.$kaikas.config.address,
          deadLine
        )
        .estimateGas();

      const lq = await this.$kaikas.routerContract.methods
        .addLiquidity(
          tokenA.address,
          tokenB.address,
          tokenAValue.toFixed(0),
          tokenBValue.toFixed(0),
          amountAMin.toFixed(0),
          amountBMin.toFixed(0),
          this.$kaikas.config.address,
          deadLine
        )
        .send({
          gas: lqGas,
          gasPrice: 250000000000,
        });

      console.log({ lq });
      this.$notify({ type: "success", text: "Liquidity success" });
    } catch (e) {
      console.log(e);
      this.$notify({ type: "error", text: e });
      throw "Error";
    }
  },
  async addLiquidityAmountIn({ rootState: { tokens } }) {
    const {
      selectedTokens: { tokenA, tokenB },
    } = tokens;

    try {
      const tokenAValue = this.$kaikas.bigNumber(tokenA.value);
      const tokenBValue = this.$kaikas.bigNumber(tokenB.value);
      const deadLine = Math.floor(Date.now() / 1000 + 300);
      const amountAMin = tokenAValue.minus(tokenAValue.dividedToIntegerBy(100));
      const amountBMin = tokenBValue.minus(tokenBValue.dividedToIntegerBy(100));

      await this.$kaikas.config.approveAmount(
        tokenA.address,
        kep7.abi,
        tokenAValue.toFixed(0)
      );
      await this.$kaikas.config.approveAmount(
        tokenB.address,
        kep7.abi,
        tokenBValue.toFixed(0)
      );

      const pairAddress = await this.$kaikas.config.factoryContract.methods
        .getPair(tokenA.address, tokenB.address)
        .call({
          from: this.address,
        });

      if (!this.$kaikas.utils.isEmptyAddress(pairAddress)) {
        const { gas, send } =
          await this.$kaikas.liquidity.addLiquidityAmountInForExistPair({
            pairAddress,
            tokenAValue,
            tokenBValue,
            tokenAddressA: tokenA.address,
            tokenAddressB: tokenB.address,
            amountBMin,
            deadLine,
          });

        await send();
        this.$notify({ type: "success", text: "Liquidity success" });

        return;
      }

      const lqGas = await this.$kaikas.config.routerContract.methods
        .addLiquidity(
          tokenA.address,
          tokenB.address,
          tokenAValue.toFixed(0),
          tokenBValue.toFixed(0),
          amountAMin.toFixed(0),
          amountBMin.toFixed(0),
          this.$kaikas.config.address,
          deadLine
        )
        .estimateGas();

      const lq = await this.$kaikas.config.routerContract.methods
        .addLiquidity(
          tokenA.address,
          tokenB.address,
          tokenAValue.toFixed(0),
          tokenBValue.toFixed(0),
          amountAMin.toFixed(0),
          amountBMin.toFixed(0),
          this.$kaikas.config.address,
          deadLine
        )
        .send({
          from: config.address,
          gas: lqGas,
          gasPrice: 250000000000,
        });

      console.log({ lq });
      this.$notify({ type: "success", text: "Liquidity success" });
    } catch (e) {
      console.log(e);
      this.$notify({ type: "error", text: "Liquidity error" });
      throw "Error";
    }
  },
  async addLiquidityETH({ rootState: { tokens } }) {
    const {
      selectedTokens: { tokenA, tokenB },
    } = tokens;

    const sortedPair = this.$kaikas.utils.sortKlayPair(tokenA, tokenB);
    const tokenAValue = this.$kaikas.utils.bigNumber(sortedPair[0].value);
    const tokenBValue = this.$kaikas.utils.bigNumber(sortedPair[1].value); // KLAY

    const deadLine = Math.floor(Date.now() / 1000 + 300);

    const amountAMin = tokenAValue.minus(tokenAValue.dividedToIntegerBy(100));
    const amountBMin = tokenBValue.minus(tokenBValue.dividedToIntegerBy(100));

    await this.$kaikas.config.approveAmount(
      sortedPair[0].address,
      kep7.abi,
      tokenAValue.toFixed(0)
    );

    await this.$kaikas.config.approveAmount(
      sortedPair[1].address,
      kep7.abi,
      tokenBValue.toFixed(0)
    );

    const pairAddress = await this.$kaikas.config.factoryContract.methods
      .getPair(sortedPair[0].address, sortedPair[1].address)
      .call({
        from: config.address,
      });

    if (!this.$kaikas.utils.isEmptyAddress(pairAddress)) {
      const { send } =
        await this.$kaikas.liquidity.addLiquidityKlayForExistsPair({
          tokenAValue,
          tokenBValue,
          amountAMin,
          addressA: sortedPair[0].address,
          deadLine,
        });
      return await send();
    }

    const { send } = await this.$kaikas.liquidity.addLiquidityKlay({
      addressA: sortedPair[0].address,
      tokenAValue,
      tokenBValue,
      amountAMin,
      amountBMin,
      deadLine,
    });

    return await send();
  },
};

export const mutations = {
  SET_PAIRS(state, pairs) {
    state.pairs = pairs;

    return state;
  },
};
