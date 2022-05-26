import config from "@/plugins/Config";
import kep7 from "@/utils/smartcontracts/kep-7.json";
import utils from "@/plugins/utils";

export default class Swap {
  async getAmountOut(addressA, addressB, value) {
    const pairAddress = await config.factoryContract.methods
      .getPair(addressA, addressB)
      .call({
        from: this.address,
      });

    if (utils.isEmptyAddress(pairAddress)) {
      throw "EMPTY_ADDRESS";
    }

    const res = await config.routerContract.methods
      .getAmountsOut(value, [addressA, addressB])
      .call();

    console.log({res, value})

    return res
  }
  async getAmountIn(addressA, addressB, value) {
    const pairAddress = await config.factoryContract.methods
      .getPair(addressA, addressB)
      .call({
        from: this.address,
      });

    if (utils.isEmptyAddress(pairAddress)) {
      throw "EMPTY_ADDRESS";
    }

    return await config.routerContract.methods
      .getAmountsIn(value, [addressA, addressB])
      .call();
  }
  async swapExactTokensForTokens({ addressA, addressB, valueA, valueB }) {
    try {
      const deadLine = Math.floor(Date.now() / 1000 + 300);

      const swapGas = await config.routerContract.methods
        .swapExactTokensForTokens(
          valueA,
          valueB,
          [addressA, addressB],
          config.address,
          deadLine
        )
        .estimateGas();

      const send = async () =>
        await config.routerContract.methods
          .swapExactTokensForTokens(
            valueA,
            valueB,
            [addressA, addressB],
            config.address,
            deadLine
          )
          .send({
            from: config.address,
            gas: swapGas,
            gasPrice: 250000000000,
          });

      return {
        swapGas,
        send,
      };
    } catch (e) {
      console.log(e);
    }
  }
  async swapTokensForExactTokens({ addressA, addressB, valueA, valueB }) {
    const deadLine = Math.floor(Date.now() / 1000 + 300);
    debugger
    const swapGas = await config.routerContract.methods
      .swapTokensForExactTokens(
        valueB,
        valueA,
        [addressA, addressB],
        config.address,
        deadLine
      )
      .estimateGas();

    const send = async () =>
      await config.routerContract.methods
        .swapTokensForExactTokens(
          valueB,
          valueA,
          [addressA, addressB],
          config.address,
          deadLine
        )
        .send({
          from: config.address,
          gas: swapGas,
          gasPrice: 250000000000,
        });

    return { swapGas, send };
  }
}
