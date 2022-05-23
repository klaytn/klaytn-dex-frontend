import config from "~/plugins/Config";
import pairAbi from "@/utils/smartcontracts/pair.json";
import kep7 from "@/utils/smartcontracts/kep-7.json";
import utils from "@/plugins/utils";

export class Liquidity {
  async addLiquidityAmountOutForExistPair({
    pairAddress,
    tokenAValue,
    tokenAddressA,
    tokenAddressB,
    amountAMin,
    deadLine,
  }) {
    const pairContract = config.createContract(pairAddress, pairAbi.abi);

    const reserves = await pairContract.methods.getReserves().call();

    const quote = await config.routerContract.methods
      .quote(tokenAValue.toFixed(0), reserves[0], reserves[1])
      .call();

    const quoteValue =utils.bigNumber(quote);

    const params = {
      tokenAAddress: tokenAddressA,
      tokenBAddress: tokenAddressB,
      tokenAValue: tokenAValue.toFixed(0),
      tokenBValue: quoteValue.toFixed(0),
      amountAMin: amountAMin.toFixed(0),
      amountBMin: quoteValue
        .minus(quoteValue.dividedToIntegerBy(100))
        .toFixed(0),
      userAddress: config.address,
      deadLine: deadLine,
    };

    await config.approveAmount(tokenAddressB, kep7.abi, quoteValue.toString());
    await config.approveAmount(tokenAddressA, kep7.abi, tokenAValue.toString());

    const lqGas = await config.routerContract.methods
      .addLiquidity(
        params.tokenAAddress,
        params.tokenBAddress,
        params.tokenAValue,
        params.tokenBValue,
        params.amountAMin,
        params.amountBMin,
        params.userAddress,
        params.deadLine
      )
      .estimateGas();
    console.log({ lqGas });

    const send = async () =>
      await config.routerContract.methods
        .addLiquidity(
          params.tokenAAddress,
          params.tokenBAddress,
          params.tokenAValue,
          params.tokenBValue,
          params.amountAMin,
          params.amountBMin,
          params.userAddress,
          params.deadLine
        )
        .send({
          from: config.address,
          gas: lqGas,
          gasPrice: 250000000000,
        });

    return {
      gas: lqGas,
      send,
    };
  }

  async addLiquidityAmountInForExistPair({
    pairAddress,
    tokenBValue,
    tokenAddressA,
    tokenAddressB,
    amountBMin,
    deadLine,
  }) {
    const pairContract = config.createContract(pairAddress, pairAbi.abi);

    const reserves = await pairContract.methods.getReserves().call();

    const quote = await config.routerContract.methods
      .quote(tokenBValue.toFixed(0), reserves[1], reserves[0])
      .call();

    const quoteValue = utils.bigNumber(quote);

    const params = {
      tokenAAddress: tokenAddressA,
      tokenBAddress: tokenAddressB,
      tokenAValue: quoteValue.toFixed(0),
      tokenBValue: tokenBValue.toFixed(0),
      amountAMin: quoteValue
        .minus(quoteValue.dividedToIntegerBy(100))
        .toFixed(0),
      amountBMin: amountBMin.toFixed(0),
      userAddress: config.address,
      deadLine: deadLine,
    };

    await config.approveAmount(tokenAddressA, kep7.abi, quoteValue.toString());
    await config.approveAmount(tokenAddressB, kep7.abi, tokenBValue.toString());

    const lqGas = await config.routerContract.methods
      .addLiquidity(
        params.tokenBAddress,
        params.tokenAAddress,
        params.tokenBValue,
        params.tokenAValue,
        params.amountBMin,
        params.amountAMin,
        params.userAddress,
        params.deadLine
      )
      .estimateGas();
    console.log({ lqGas });

    const send = async () =>
      await config.routerContract.methods
        .addLiquidity(
          params.tokenAAddress,
          params.tokenBAddress,
          params.tokenAValue,
          params.tokenBValue,
          params.amountAMin,
          params.amountBMin,
          params.userAddress,
          params.deadLine
        )
        .send({
          from: config.address,
          gas: lqGas,
          gasPrice: 250000000000,
        });

    return {
      gas: lqGas,
      send,
    };
  }

  async addLiquidityKlayForExistsPair({
    pairAddress,
    tokenAValue,
    addressA,
    amountAMin,
    deadLine,
  }) {
    const pairContract = config.createContract(pairAddress, pairAbi.abi);

    const reserves = await pairContract.methods.getReserves().call({
      from: config.address,
    });

    const quote = await config.routerContract.methods
      .quote(tokenAValue.toString(), reserves[0], reserves[1])
      .call({
        from: config.address,
      });

    const quoteValue = utils.bigNumber(quote);

    const params = {
      addressA,
      tokenAValue: tokenAValue.toString(),
      amountAMin: amountAMin.toString(),
      amountBMin: quoteValue
        .minus(quoteValue.dividedToIntegerBy(100))
        .toString(),
      address: config.address,
      deadLine,
    };
    await config.approveAmount(
      "0xae3a8a1D877a446b22249D8676AFeB16F056B44e",
      kep7.abi,
      quoteValue.toString()
    );

    await config.approveAmount(addressA, kep7.abi, tokenAValue.toString());

    const lqETHGas = await config.routerContract.methods
      .addLiquidityETH(
        params.addressA,
        params.tokenAValue,
        params.amountAMin,
        params.amountBMin,
        params.address,
        params.deadLine
      )
      .estimateGas({
        from: config.address,
        gasPrice: 250000000000,
        value: quoteValue.toString(),
      });

    const send = async () =>
      await config.routerContract.methods
        .addLiquidityETH(
          params.addressA,
          params.tokenAValue,
          params.amountAMin,
          params.amountBMin,
          params.address,
          params.deadLine
        )
        .send({
          from: config.address,
          gasPrice: 250000000000,
          gas: lqETHGas,
          value: quoteValue.toString(),
        });
    console.log({ lqETHGas });

    return { gas: lqETHGas, send };
  }

  async addLiquidityKlay({
    addressA,
    tokenAValue,
    tokenBValue,
    amountAMin,
    amountBMin,
    deadLine,
  }) {
    const params = {
      addressA,
      tokenAValue: tokenAValue.toString(),
      amountAMin: amountAMin.toString(),
      amountBMin: amountBMin.toString(), // KLAY
      deadLine,
      address: config.address,
    };

    await config.approveAmount(
      "0xae3a8a1D877a446b22249D8676AFeB16F056B44e",
      kep7.abi,
      quoteValue.toString()
    );

    await config.approveAmount(addressA, kep7.abi, tokenAValue.toString());

    const lqETHGas = await config.routerContract.methods
      .addLiquidityETH(
        params.addressA,
        params.tokenAValue,
        params.amountAMin,
        params.amountBMin,
        params.address,
        params.deadLine
      )
      .estimateGas({
        from: config.address,
        gasPrice: 250000000000,
        value: tokenBValue.toString(),
      });

    const send = async () =>
      await config.routerContract.methods
        .addLiquidityETH(
          params.addressA,
          params.tokenAValue,
          params.amountAMin,
          params.amountBMin,
          params.address,
          params.deadLine
        )
        .send({
          from: config.address,
          gasPrice: 250000000000,
          value: tokenBValue.toString(),
          gas: lqETHGas,
        });

    console.log({ lqETHGas });
    return { gas: lqETHGas, send };
  }
}
