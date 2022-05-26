import config from "@/plugins/Config";
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

    return await config.routerContract.methods
      .getAmountsOut(value, [addressA, addressB])
      .call();
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

  async swapExactTokensForETH({ addressA, addressB, valueA, valueB }) {
    const deadLine = Math.floor(Date.now() / 1000 + 300);
    const bnValueA = utils.bigNumber(valueA);

    const swapGas = await config.routerContract.methods
      .swapExactTokensForETH(
        valueB,
        bnValueA.minus(bnValueA.dividedToIntegerBy(100)),
        [addressB, addressA],
        config.address,
        deadLine
      )
      .estimateGas({
        from: config.address,
        gasPrice: 250000000000,
      });

    const send = async () =>
      await config.routerContract.methods
        .swapExactTokensForETH(
          valueB,
          bnValueA.minus(bnValueA.dividedToIntegerBy(100)),
          [addressB, addressA],
          config.address,
          deadLine
        )
        .send({
          from: config.address,
          gas: swapGas,
          gasPrice: 250000000000,
        });
    console.log({ swapExactTokensForETH: swapGas });

    return { gas: swapGas, send };
  }

  async swapExactETHForTokens({ addressA, addressB, valueA, valueB }) {
    const deadLine = Math.floor(Date.now() / 1000 + 300);
    const bnValueA = utils.bigNumber(valueA);
    const bnValueB = utils.bigNumber(valueB);

    const swapGas = await config.routerContract.methods
      .swapExactETHForTokens(
        bnValueA.minus(bnValueA.dividedToIntegerBy(100)),
        [addressB, addressA],
        config.address,
        deadLine
      )
      .estimateGas({
        value: bnValueB.toFixed(0),
        from: config.address,
        gasPrice: 250000000000,
      });

    const send = async () =>
      await config.routerContract.methods
        .swapExactETHForTokens(
          bnValueA.minus(bnValueA.dividedToIntegerBy(100)),
          [addressB, addressA],
          config.address,
          deadLine
        )
        .send({
          value: bnValueB.toFixed(0),
          from: config.address,
          gas: swapGas,
          gasPrice: 250000000000,
        });
    console.log({ swapGas });

    return { gas: swapGas, send };
  }

  async swapEthForExactTokens({ amountOut, from, to, amountIn }) {
    const deadLine = Math.floor(Date.now() / 1000 + 300);
    const swapGas = await config.routerContract.methods
      .swapEthForExactTokens(amountIn, [from, to], config.address, deadLine)
      .estimateGas({
        value: amountOut,
        from: config.address,
        gasPrice: 250000000000,
      });

    debugger;
  }

  async swapTokensForExactETH({ amountOut, amountInMax, from, to }) {
    const deadLine = Math.floor(Date.now() / 1000 + 300);
    const amountInMaxBN = utils.bigNumber(amountInMax);
    console.log({
      amountOut,
      amountInMax: amountInMaxBN
        .minus(amountInMaxBN.dividedToIntegerBy(100))
        .toFixed(0),
      from,
      to,
    });
    try {
      debugger;
      const swapGas = await config.routerContract.methods
        .swapTokensForExactETH(
          amountOut,
          amountInMaxBN.minus(amountInMaxBN.dividedToIntegerBy(100)).toFixed(0),
          [to, from],
          config.address,
          deadLine
        )
        .estimateGas({
          from: config.address,
          gasPrice: 250000000000,
        });
      debugger;
    } catch (e) {
      console.log(e);
    }
  }
}
