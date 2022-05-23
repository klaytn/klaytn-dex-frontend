import config from "@/plugins/Config";
import kep7 from "@/utils/smartcontracts/kep-7.json";

export default class Swap {
  async swapExactTokensForTokens({ addressA, addressB, valueA, valueB }) {
    try {
      await config.approveAmount(addressA, kep7.abi, valueA);

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
