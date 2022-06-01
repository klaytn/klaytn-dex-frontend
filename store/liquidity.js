import kip7 from "@/utils/smartcontracts/kip-7.json";
import pairAbi from "@/utils/smartcontracts/pair.json";
import config from "@/plugins/Config";

export const state = () => ({
  liquidityStatus: "init",
  pairs: [],
  removeLiquidityPair: {
    lpTokenValue: null,
    tokenA: null,
    tokenB: null,
    amount1: null,
    amount0: null,
  },
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

  // async quoteForKlay({ commit, rootState: { tokens } }, { value, reversed }) {
  //   try {
  //     const {
  //       selectedTokens: { tokenA, tokenB },
  //       computedToken,
  //     } = tokens;
  //
  //     const exchangeRate = await this.$kaikas.tokens.getKlayQuote(
  //       tokenA.address,
  //       tokenB.address,
  //       value,
  //       reversed
  //     );
  //
  //     const { pairBalance, userBalance } =
  //       await this.$kaikas.tokens.getPairBalance(
  //         tokenA.address,
  //         tokenB.address
  //       );
  //
  //     commit(
  //       "tokens/SET_TOKEN_VALUE",
  //       { type: computedToken, value: exchangeRate, pairBalance, userBalance },
  //       { root: true }
  //     );
  //   } catch (e) {
  //     console.log(e);
  //     this.$notify({ type: "error", text: e });
  //   }
  //   return;
  // },

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

        pair.address = address;

        const contract = this.$kaikas.config.createContract(
          address,
          pairAbi.abi
        );

        const addressA = await contract.methods.token0().call();
        const addressB = await contract.methods.token1().call();

        const contractA = this.$kaikas.config.createContract(
          addressA,
          kip7.abi
        );
        const contractB = this.$kaikas.config.createContract(
          addressB,
          kip7.abi
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
        kip7.abi,
        tokenAValue.toFixed(0)
      );

      await this.$kaikas.config.approveAmount(
        tokenB.address,
        kip7.abi,
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
        this.$notify({
          type: "success",
          text: `Liquidity success ${tokenA.name} + ${tokenB.name}`,
        });

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
        kip7.abi,
        tokenAValue.toFixed(0)
      );
      await this.$kaikas.config.approveAmount(
        tokenB.address,
        kip7.abi,
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
        this.$notify({
          type: "success",
          text: `Liquidity success ${tokenA.name} + ${tokenB.name}`,
        });

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
      this.$notify({
        type: "success",
        text: `Liquidity success ${tokenA.name} + ${tokenB.name}`,
      });
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
      kip7.abi,
      tokenAValue.toFixed(0)
    );

    await this.$kaikas.config.approveAmount(
      sortedPair[1].address,
      kip7.abi,
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
  async calcRemoveLiquidityAmounts(
    { commit, rootState: { tokens } },
    lpTokenValue
  ) {
    const { selectedTokens } = tokens;
    const pairAddress = selectedTokens.pairAddress;
    const pairContract = this.$kaikas.config.createContract(
      pairAddress,
      pairAbi.abi
    );

    const oneBN = this.$kaikas.utils.bigNumber("1");

    const totalSupply = this.$kaikas.utils.bigNumber(
      await pairContract.methods.totalSupply().call()
    );
    const lpToken = this.$kaikas.utils.bigNumber(
      this.$kaikas.utils.toWei(lpTokenValue)
    );

    const contract0 = this.$kaikas.config.createContract(
      selectedTokens.tokenA.address,
      kip7.abi
    );
    const contract1 = this.$kaikas.config.createContract(
      selectedTokens.tokenB.address,
      kip7.abi
    );

    const balance0 = await contract0.methods.balanceOf(pairAddress).call({
      from: this.$kaikas.config.address,
    });

    const balance1 = await contract1.methods.balanceOf(pairAddress).call({
      from: this.$kaikas.config.address,
    });

    const amount0 = lpToken
      .multipliedBy(balance0)
      .dividedBy(totalSupply)
      .minus(oneBN);
    const amount1 = lpToken
      .multipliedBy(balance1)
      .dividedBy(totalSupply)
      .minus(oneBN);

    console.log({
      amount0: amount0.toFixed(0),
      amount1: amount1.toFixed(0),
    });

    commit("SET_AMOUNTS", {
      amount0: amount0.toFixed(0),
      amount1: amount1.toFixed(0),
    });
  },
  async removeLiquidity({ rootState: { tokens, liquidity } }) {
    const { selectedTokens } = tokens;
    const { removeLiquidityPair } = liquidity;

    // amount0 = (liquidity * balance0) / _totalSupply; // using balances ensures pro-rata distribution
    // amount1 = (liquidity * balance1) / _totalSupply; // using balances ensures pro-rata distribution
    //
    // amountAMin = amount0
    //
    // amountBMin = amount1
    //
    // balance0 = IKIP7(_token0).balanceOf(pairAddress);
    // balance1 = IKIP7(_token1).balanceOf(pairAddress);

    const pairAddress = selectedTokens.pairAddress;
    const pairContract = this.$kaikas.config.createContract(
      pairAddress,
      pairAbi.abi
    );

    const oneBN = this.$kaikas.utils.bigNumber("1");
    const pairBalance = await pairContract.methods
      .balanceOf(pairAddress)
      .call();

    const totalSupply = this.$kaikas.utils.bigNumber(
      await pairContract.methods.totalSupply().call()
    );

    const lpToken = this.$kaikas.utils.bigNumber(
      this.$kaikas.utils.toWei(removeLiquidityPair.lpTokenValue).toString()
    );

    await this.$kaikas.config.approveAmount(
      pairAddress,
      pairAbi.abi,
      lpToken.toFixed(0)
    );

    const contract0 = this.$kaikas.config.createContract(
      selectedTokens.tokenA.address,
      kip7.abi
    );
    const contract1 = this.$kaikas.config.createContract(
      selectedTokens.tokenB.address,
      kip7.abi
    );

    const balance0 = await contract0.methods.balanceOf(pairAddress).call({
      from: this.$kaikas.config.address,
    });

    const balance1 = await contract1.methods.balanceOf(pairAddress).call({
      from: this.$kaikas.config.address,
    });

    const amount0 = lpToken
      .multipliedBy(balance0)
      .dividedBy(totalSupply)
      .minus(oneBN);
    const amount1 = lpToken
      .multipliedBy(balance1)
      .dividedBy(totalSupply)
      .minus(oneBN);

    const deadLine = Math.floor(Date.now() / 1000 + 300);

    const params = {
      addressA: selectedTokens.tokenA.address,
      addressB: selectedTokens.tokenB.address,
      lpToken: lpToken.toFixed(0),
      amount0: amount0.minus(oneBN).toFixed(0),
      amount1: amount1.minus(oneBN).toFixed(0),
      address: this.$kaikas.config.address,
      deadLine,
    };

    console.log({
      ...params,
      totalSupply: totalSupply.toFixed(0),
      balance0: balance0,
      balance1: balance1,
      pairBalance,
      amount0N: amount0.toFixed(0),
      amount1N: amount1.toFixed(0),
    });

    try {
      // - address tokenA,
      // - address tokenB,
      // - uint256 liquidity,
      // - uint256 amountAMin,
      // - uint256 amountBMin,
      // - address to,
      // - uint256 deadline

      const removeLiqGas = await this.$kaikas.config.routerContract.methods
        .removeLiquidity(
          params.addressA,
          params.addressB,
          params.lpToken,
          params.amount0,
          params.amount1,
          params.address,
          params.deadLine
        )
        .estimateGas({
          from: this.$kaikas.config.address,
          gasPrice: 250000000000,
        });

      const res = await this.$kaikas.config.routerContract.methods
        .removeLiquidity(
          params.addressA,
          params.addressB,
          params.lpToken,
          params.amount0,
          params.amount1,
          params.address,
          params.deadLine
        )
        .send({
          from: this.$kaikas.config.address,
          gasPrice: 250000000000,
          gas: removeLiqGas,
        });

      console.log({ removeLiqGas, res });
    } catch (e) {
      console.log(e);
    }
  },
  async removeLiquidityETH({ rootState: { tokens } }) {
    const { selectedTokens } = tokens;

    //   address token, not klay
    //   uint256 liquidity,
    //   uint256 amountTokenMin, // amountTokenMin = (liquidity * balance1) / _totalSupply;
    //   uint256 amountETHMin,   // amountTokenMin = (liquidity * wklayBalance) / _totalSupply;
    //   address to,
    //   uint256 deadline

    const pairAddress = selectedTokens.pairAddress;
    const pairContract = this.$kaikas.config.createContract(
      pairAddress,
      pairAbi.abi
    );

    const oneBN = this.$kaikas.utils.bigNumber("1");

    const pairBalance = await pairContract.methods
      .balanceOf(pairAddress)
      .call();

    const totalSupply = this.$kaikas.utils.bigNumber(
      await pairContract.methods.totalSupply().call()
    );

    const lpToken = this.$kaikas.utils.bigNumber(
      this.$kaikas.utils.toWei("10")
    );

    await this.$kaikas.config.approveAmount(
      pairAddress,
      pairAbi.abi,
      lpToken.toFixed(0)
    );

    const contract0 = this.$kaikas.config.createContract(
      selectedTokens.tokenA.address,
      kip7.abi
    );
    const contract1 = this.$kaikas.config.createContract(
      selectedTokens.tokenB.address,
      kip7.abi
    );

    const balance0 = this.$kaikas.utils.bigNumber(
      await contract0.methods.balanceOf(pairAddress).call({
        from: this.$kaikas.config.address,
      })
    );

    const balance1 = this.$kaikas.utils.bigNumber(
      await contract1.methods.balanceOf(pairAddress).call({
        from: this.$kaikas.config.address,
      })
    );

    const amount0 = lpToken
      .multipliedBy(balance0)
      .dividedBy(totalSupply)
      .minus(oneBN);
    const amount1 = lpToken
      .multipliedBy(balance1)
      .dividedBy(totalSupply)
      .minus(oneBN);

    const deadLine = Math.floor(Date.now() / 1000 + 300);

    const params = {
      addressA: selectedTokens.tokenA.address,
      addressB: selectedTokens.tokenB.address,
      lpToken: lpToken.toFixed(0),
      amount0: amount0.minus(oneBN).toFixed(0),
      amount1: amount1.minus(oneBN).toFixed(0),
      address: this.$kaikas.config.address,
      deadLine,
    };

    console.log({
      ...params,
      totalSupply: totalSupply.toFixed(0),
      balance0: balance0.toFixed(0),
      balance1: balance1.toFixed(0),
      pairBalance,
      amount0N: amount0.toFixed(0),
      amount1N: amount1.toFixed(0),
    });

    try {
      // - address tokenA,
      // - address tokenB,
      // - uint256 liquidity,
      // - uint256 amountAMin,
      // - uint256 amountBMin,
      // - address to,
      // - uint256 deadline

      const removeLiqGas = await this.$kaikas.config.routerContract.methods
        .removeLiquidity(
          params.addressA,
          params.addressB,
          params.lpToken,
          params.amount0,
          params.amount1,
          params.address,
          params.deadLine
        )
        .estimateGas({
          from: this.$kaikas.config.address,
          gasPrice: 250000000000,
        });

      const res = await this.$kaikas.config.routerContract.methods
        .removeLiquidity(
          params.addressA,
          params.addressB,
          params.lpToken,
          params.amount0,
          params.amount1,
          params.address,
          params.deadLine
        )
        .send({
          from: this.$kaikas.config.address,
          gasPrice: 250000000000,
          gas: removeLiqGas,
        });

      console.log({ removeLiqGas, res });
    } catch (e) {
      console.log(e);
    }
  },
};

export const mutations = {
  SET_PAIRS(state, pairs) {
    state.pairs = pairs;

    return state;
  },
  SET_AMOUNTS(state, { amount0, amount1 }) {
    state.removeLiquidityPair = {
      ...state.removeLiquidityPair,
      amount0,
      amount1,
    };

    return state;
  },
  SET_RM_LIQ_VALUE(state, lpTokenValue) {
    state.removeLiquidityPair = {
      ...state.removeLiquidityPair,
      lpTokenValue,
    };

    return state;
  },
};
