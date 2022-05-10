import kep7 from "@/utils/smartcontracts/kep-7.json";

export const state = () => ({
  liquidityStatus: "init",
});

export const actions = {
  async addLiquidity({ state, rootState: { tokens } }) {
    // TODO it needs when creating lq

    const {
      selectedTokens: { tokenA, tokenB },
    } = tokens;

    try {
      const tokenAValue = tokenA.value;
      const tokenBValue = tokenB.value;

      const deadLine = Math.floor(Date.now() / 1000 + 3000);

      await this.$kaikas.approveAmount(tokenA.address, kep7.abi, tokenAValue);
      await this.$kaikas.approveAmount(tokenB.address, kep7.abi, tokenBValue);

      console.log(
        tokenA.address,
        tokenB.address,
        tokenAValue,
        tokenBValue,
        tokenAValue,
        tokenBValue,
        this.$kaikas.address,
        deadLine
      );
      const lqGas = await this.$kaikas.routerContract.methods
        .addLiquidity(
          tokenA.address,
          tokenB.address,
          tokenAValue,
          tokenBValue,
          tokenAValue,
          tokenBValue,
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
          tokenAValue,
          tokenAValue,
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
