import kep7 from "@/utils/smartcontracts/kep-7.json";
import pair from "@/utils/smartcontracts/pair.json";

export const state = () => ({
  liquidityStatus: "init",
  pairs: []
});

export const actions = {
  async getPairs({commit}) {
    const pairs = [];
    const pairsCount = await this.$kaikas.factoryContract.methods
      .allPairsLength()
      .call();

    for (let i = 0; i < pairsCount; i++) {

      const address = await this.$kaikas.factoryContract.methods
        .allPairs(i)
        .call();

      const contract = this.$kaikas.createContract(address, pair.abi);
      const name = await contract.methods.name().call();
      const symbol = await contract.methods.symbol().call();
      const balance = await contract.methods
        .balanceOf(this.$kaikas.address)
        .call();

      pairs.push({
        balance,
        symbol,
        name,
      });
    }
    console.log(pairs);
    commit('SET_PAIRS', pairs)
  },
  async addLiquidity({ rootState: { tokens, swap } }) {
    const {
      selectedTokens: { tokenA, tokenB },
    } = tokens;

    const { slippagePercent } = swap;

    try {
      const tokenAValue = tokenA.value;
      const tokenBValue = tokenB.value;

      const deadLine = Math.floor(Date.now() / 1000 + 300);

      const amountAMin = `${Math.floor(
        tokenAValue - (tokenAValue / 100) * slippagePercent
      )}`;
      const amountBMin = `${Math.floor(
        tokenBValue - (tokenBValue / 100) * slippagePercent
      )}`;
      debugger;

      await this.$kaikas.approveAmount(tokenA.address, kep7.abi, tokenAValue);
      await this.$kaikas.approveAmount(tokenB.address, kep7.abi, tokenBValue);

      const lqGas = await this.$kaikas.routerContract.methods
        .addLiquidity(
          tokenA.address,
          tokenB.address,
          tokenAValue,
          tokenBValue,
          amountAMin,
          amountBMin,
          this.$kaikas.address,
          deadLine
        )
        .estimateGas();

      const lq = await this.$kaikas.routerContract.methods
        .addLiquidity(
          tokenA.address,
          tokenB.address,
          tokenAValue,
          tokenBValue,
          amountAMin,
          amountBMin,
          this.$kaikas.address,
          deadLine
        )
        .send({
          from: this.$kaikas.address,
          gas: lqGas,
          gasPrice: 750000000000,
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
}
