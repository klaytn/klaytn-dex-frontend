import config from "@/plugins/Config";
import utils from "@/plugins/utils";
import pair from "@/utils/smartcontracts/pair.json";

export default class Tokens {
  async getExchangeRate(addressA, addressB, value, reversed) {
    const pairAddress = await config.factoryContract.methods
      .getPair(addressA, addressB)
      .call({
        from: config.address,
      });

    if (utils.isEmptyAddress(pairAddress)) {
      throw "EMPTY_ADDRESS";
    }

    const pairContract = config.createContract(pairAddress, pair.abi);

    const reserves = await pairContract.methods.getReserves().call({
      from: config.address,
    });

    return await config.routerContract.methods
      .quote(
        value,
        reversed ? reserves[1] : reserves[0],
        reversed ? reserves[0] : reserves[1]
      )
      .call({
        from: config.address,
      });
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
    const userBalance = await pairContract.methods
      .balanceOf(config.address)
      .call();

    return { pairBalance, userBalance };
  }

  async getPairAddress(addressA, addressB) {
    return await config.factoryContract.methods
      .getPair(addressA, addressB)
      .call({
        from: config.address,
      });
  }
}
