import kep7 from "@/utils/smartcontracts/kep-7.json";

export const state = () => ({
  liquidityStatus: "init",
});

export const actions = {
  async addLiquidity({ rootState: { tokens, swap } }) {

    const {
      selectedTokens: { tokenA, tokenB },
    } = tokens;

    const {slippagePercent} = swap

    try {
      const tokenAValue = tokenA.value;
      const tokenBValue = tokenB.value;

      const deadLine = Math.floor(Date.now() / 1000 + 300);

      const amountAMin = `${Math.floor(tokenAValue - tokenAValue / 100 * slippagePercent )}`;
      const amountBMin = `${Math.floor(tokenBValue - tokenBValue / 100 * slippagePercent)}`;
      debugger

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
