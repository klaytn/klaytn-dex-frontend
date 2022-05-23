import config from "@/plugins/Config";
import utils from "@/plugins/utils";
import pair from "@/utils/smartcontracts/pair.json";

export default class Tokens {
  async getAmountOut(addressA, addressB, value) {
    const pairAddress = await config.factoryContract.methods
      .getPair(addressA, addressB)
      .call({
        from: config.address,
      });

    if (utils.isEmptyAddress(pairAddress)) {
      throw "EMPTY_ADDRESS";
    }

    return await config.routerContract.methods
      .getAmountsOut(value, [addressA, addressB])
      .call();
  }

  async getAmountIn(addressA, addressB, value) {
    const pairAddress = await config.factoryContract.methods
      .getPair(addressA, addressB)
      .call({
        from: config.address,
      });

    if (utils.isEmptyAddress(pairAddress)) {
      throw "EMPTY_ADDRESS";
    }

    return await config.routerContract.methods
      .getAmountsIn(value, [addressA, addressB])
      .call();
  }

  async getPairBalance(addressA, addressB) {
    const pairAddress = await config.factoryContract.methods
      .getPair(addressA, addressB)
      .call({
        from: config.address,
      });

    if (utils.isEmptyAddress(pairAddress)) {
      throw "EMPTY_ADDRESS";
    }

    const pairContract = config.createContract(pairAddress, pair.abi);

    const pairBalance = await pairContract.methods.totalSupply().call();
    const userBalance = await pairContract.methods.balanceOf(config.address).call();

    return { pairBalance, userBalance };
  }
}
