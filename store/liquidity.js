import kep7 from "@/utils/smartcontracts/kep-7.json";
import pairAbi from "@/utils/smartcontracts/pair.json";

export const state = () => ({
  liquidityStatus: "init",
  pairs: [],
});

export const actions = {
  async getPairs({ commit }) {
    const pairsCount = await this.$kaikas.factoryContract.methods
      .allPairsLength()
      .call();

    const pairs = await Promise.all(
      new Array(Number(pairsCount)).fill(null).map(async (it, i) => {
        let pair = {};

        const address = await this.$kaikas.factoryContract.methods
          .allPairs(i)
          .call();

        const contract = this.$kaikas.createContract(address, pairAbi.abi);

        const addressA = await contract.methods.token0().call();
        const addressB = await contract.methods.token1().call();

        const contractA = this.$kaikas.createContract(addressA, kep7.abi);
        const contractB = this.$kaikas.createContract(addressB, kep7.abi);

        let name = await contract.methods.name().call();
        let symbol = await contract.methods.symbol().call();

        if (
          !this.$kaikas.isEmptyAddress(addressA) &&
          !this.$kaikas.isEmptyAddress(addressB)
        ) {
          const symbolA = await contractA.methods.symbol().call();
          const symbolB = await contractB.methods.symbol().call();

          name = `${symbolA} - ${symbolB}`;

          pair.symbolA = symbolA;
          pair.symbolB = symbolB;
        }

        const pairBalance = await contract.methods.totalSupply().call();
        const userBalance = await contract.methods
          .balanceOf(this.$kaikas.address)
          .call();

        const reserves = await contract.methods.getReserves().call({
          from: this.$kaikas.address,
        });

        console.log(name, "reserves ", reserves);

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

    console.log(pairs);
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

      const pairAddress = await this.$kaikas.factoryContract.methods
        .getPair(tokenA.address, tokenB.address)
        .call({
          from: this.address,
        });

      if (!this.$kaikas.isEmptyAddress(pairAddress)) {
        const { gas, send } =
          await this.$kaikas.addLiquidityAmountOutForExistPair({
            pairAddress,
            tokenAValue,
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

      await this.$kaikas.approveAmount(
        tokenA.address,
        kep7.abi,
        tokenAValue.toString()
      );
      await this.$kaikas.approveAmount(
        tokenB.address,
        kep7.abi,
        tokenBValue.toString()
      );

      const lqGas = await this.$kaikas.routerContract.methods
        .addLiquidity(
          tokenA.address,
          tokenB.address,
          tokenAValue.toFixed(0),
          tokenBValue.toFixed(0),
          amountAMin.toFixed(0),
          amountBMin.toFixed(0),
          this.$kaikas.address,
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
          this.$kaikas.address,
          deadLine
        )
        .send({
          from: this.$kaikas.address,
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

      const pairAddress = await this.$kaikas.factoryContract.methods
        .getPair(tokenA.address, tokenB.address)
        .call({
          from: this.address,
        });

      if (!this.$kaikas.isEmptyAddress(pairAddress)) {
        const { gas, send } =
          await this.$kaikas.addLiquidityAmountInForExistPair({
            pairAddress,
            tokenBValue,
            tokenAddressA: tokenA.address,
            tokenAddressB: tokenB.address,
            amountBMin,
            deadLine,
          });

        await send();
        this.$notify({ type: "success", text: "Liquidity success" });

        console.log("addLiquidityAmountInForExistPair ", gas);
        return;
      }

      await this.$kaikas.approveAmount(
        tokenA.address,
        kep7.abi,
        tokenAValue.toString()
      );
      await this.$kaikas.approveAmount(
        tokenB.address,
        kep7.abi,
        tokenBValue.toString()
      );

      const lqGas = await this.$kaikas.routerContract.methods
        .addLiquidity(
          tokenA.address,
          tokenB.address,
          tokenAValue.toFixed(0),
          tokenBValue.toFixed(0),
          amountAMin.toFixed(0),
          amountBMin.toFixed(0),
          this.$kaikas.address,
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
          this.$kaikas.address,
          deadLine
        )
        .send({
          from: this.$kaikas.address,
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
    const sortedPair = this.$kaikas.sortKlayPair(tokenA, tokenB);
    const tokenAValue = this.$kaikas.bigNumber(sortedPair[0].value);
    const tokenBValue = this.$kaikas.bigNumber(sortedPair[1].value); // KLAY

    const deadLine = Math.floor(Date.now() / 1000 + 300);

    const amountAMin = tokenAValue.minus(tokenAValue.dividedToIntegerBy(100));
    const amountBMin = tokenBValue.minus(tokenBValue.dividedToIntegerBy(100));

    await this.$kaikas.approveAmount(
      sortedPair[0].address,
      kep7.abi,
      tokenAValue.toString()
    );

    const pairAddress = await this.$kaikas.factoryContract.methods
      .getPair(sortedPair[0].address, sortedPair[1].address)
      .call({
        from: this.address,
      });

    if (!this.$kaikas.isEmptyAddress(pairAddress)) {
      const { send } = await this.$kaikas.addLiquidityKlayForExistsPair({
        pairAddress,
        tokenAValue,
        amountAMin,
        addressA: sortedPair[0].address,
        deadLine,
      });
      return await send();
    }

    await this.$kaikas.approveAmount(
      sortedPair[0].address,
      kep7.abi,
      tokenAValue.toString()
    );

    await this.$kaikas.approveAmount(
      sortedPair[1].address,
      kep7.abi,
      tokenBValue.toString()
    );

    const { send } = await this.$kaikas.addLiquidityKlay({
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
