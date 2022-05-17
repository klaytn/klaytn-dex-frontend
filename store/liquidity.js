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


        console.log(name, 'reserves ', reserves)

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
  async addLiquidity({ rootState: { tokens, swap } }) {

    const {
      selectedTokens: { tokenA, tokenB },
    } = tokens;

    const {slippagePercent} = swap

    try {
      const tokenAValue = this.$kaikas.bigNumber(tokenA.value);
      const tokenBValue = this.$kaikas.bigNumber(tokenB.value);

      const deadLine = Math.floor(Date.now() / 1000 + 300);

      const amountAMin = tokenAValue.dividedToIntegerBy(10)
      //   `${Math.floor(
      //   tokenAValue / 10 // / (tokenAValue * slippagePercent / 100)
      // )}`;

      const amountBMin = tokenBValue.dividedToIntegerBy(10)

      console.log(
        tokenA.address,
        tokenB.address,
        tokenAValue.toFixed(0),
        tokenBValue.toFixed(0),
        amountAMin.toFixed(0),
        amountBMin.toFixed(0),
      )

      await this.$kaikas.approveAmount(tokenA.address, kep7.abi, tokenAValue);
      await this.$kaikas.approveAmount(tokenB.address, kep7.abi, tokenBValue);


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
      console.log({ lqGas });

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
    } catch (e) {
      console.log(e);
      throw "Error";
    }
  },
};

export const mutations = {
  SET_PAIRS(state, pairs) {
    state.pairs = pairs;

    return state;
  },
};
