import pair from "~/utils/smartcontracts/pair.json";
import kep7 from "~/utils/smartcontracts/kep-7.json";
import pairAbi from "~/utils/smartcontracts/pair.json";

export default class Smartcontarcts {
  async approveAmount(address, abi, amount) {
    const contract = this.createContract(address, abi);

    const allowance = await contract.methods
      .allowance(this.address, this.routerAddress)
      .call({
        from: this.address,
      });

    const amountValue = this.bigNumber(amount);
    const allowanceValue = this.bigNumber(allowance);

    if (amountValue.isLessThanOrEqualTo(allowanceValue)) {
      return amount;
    }

    const gas = await contract.methods
      .approve(this.routerAddress, amount)
      .estimateGas();

    return await contract.methods.approve(this.routerAddress, amount).send({
      from: this.address,
      gas,
      gasPrice: 250000000000,
    });
  }

  async getAmountOut(addressA, addressB, value) {
    const pairAddress = await this.factoryContract.methods
      .getPair(addressA, addressB)
      .call({
        from: this.address,
      });

    if (this.isEmptyAddress(pairAddress)) {
      throw "EMPTY_ADDRESS";
    }

    return await this.routerContract.methods
      .getAmountsOut(value, [addressA, addressB])
      .call();
  }

  async getAmountIn(addressA, addressB, value) {
    const pairAddress = await this.factoryContract.methods
      .getPair(addressA, addressB)
      .call({
        from: this.address,
      });

    if (this.isEmptyAddress(pairAddress)) {
      throw "EMPTY_ADDRESS";
    }

    return await this.routerContract.methods
      .getAmountsIn(value, [addressA, addressB])
      .call();
  }

  async getPairBalance(addressA, addressB) {
    const pairAddress = await this.factoryContract.methods
      .getPair(addressA, addressB)
      .call({
        from: this.address,
      });

    if (this.isEmptyAddress(pairAddress)) {
      throw "EMPTY_ADDRESS";
    }

    const pairContract = this.createContract(pairAddress, pair.abi);
    const pairBalance = await pairContract.methods.totalSupply().call();
    const userBalance = await pairContract.methods
      .balanceOf(this.address)
      .call();

    return { pairBalance, userBalance };
  }

  async swapExactTokensForTokens({ addressA, addressB, valueA, valueB }) {
    try {
      await this.approveAmount(addressA, kep7.abi, valueA);

      const deadLine = Math.floor(Date.now() / 1000 + 300);
      const swapGas = await this.routerContract.methods
        .swapExactTokensForTokens(
          valueA,
          valueB,
          [addressA, addressB],
          this.address,
          deadLine
        )
        .estimateGas();

      const send = async () =>
        await this.routerContract.methods
          .swapExactTokensForTokens(
            valueA,
            valueB,
            [addressA, addressB],
            this.address,
            deadLine
          )
          .send({
            from: this.address,
            gas: swapGas,
            gasPrice: 250000000000,
          });

      debugger;

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
    const swapGas = await this.routerContract.methods
      .swapTokensForExactTokens(
        valueB,
        valueA,
        [addressA, addressB],
        this.address,
        deadLine
      )
      .estimateGas();

    const send = async () =>
      await this.routerContract.methods
        .swapTokensForExactTokens(
          valueB,
          valueA,
          [addressA, addressB],
          this.address,
          deadLine
        )
        .send({
          from: this.address,
          gas: swapGas,
          gasPrice: 250000000000,
        });

    return { swapGas, send };
  }

  async addLiquidityAmountOutForExistPair({
    pairAddress,
    tokenAValue,
    tokenAddressA,
    tokenAddressB,
    amountAMin,
    deadLine,
  }) {
    const pairContract = this.createContract(pairAddress, pairAbi.abi);

    const reserves = await pairContract.methods.getReserves().call();

    const quote = await this.routerContract.methods
      .quote(tokenAValue.toFixed(0), reserves[0], reserves[1])
      .call();

    const quoteValue = this.bigNumber(quote);

    const params = {
      tokenAAddress: tokenAddressA,
      tokenBAddress: tokenAddressB,
      tokenAValue: tokenAValue.toFixed(0),
      tokenBValue: quoteValue.toFixed(0),
      amountAMin: amountAMin.toFixed(0),
      amountBMin: quoteValue
        .minus(quoteValue.dividedToIntegerBy(100))
        .toFixed(0),
      userAddress: this.address,
      deadLine: deadLine,
    };

    await this.approveAmount(tokenAddressB, kep7.abi, quoteValue.toFixed(0));

    const lqGas = await this.routerContract.methods
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
      await this.routerContract.methods
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
          from: this.address,
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
    const pairContract = this.createContract(pairAddress, pairAbi.abi);

    const reserves = await pairContract.methods.getReserves().call();

    const quote = await this.routerContract.methods
      .quote(tokenBValue.toFixed(0), reserves[1], reserves[0])
      .call();

    const quoteValue = this.bigNumber(quote);

    const params = {
      tokenAAddress: tokenAddressA,
      tokenBAddress: tokenAddressB,
      tokenAValue: quoteValue.toFixed(0),
      tokenBValue: tokenBValue.toFixed(0),
      amountAMin: quoteValue
        .minus(quoteValue.dividedToIntegerBy(100))
        .toFixed(0),
      amountBMin: amountBMin.toFixed(0),
      userAddress: this.address,
      deadLine: deadLine,
    };

    await this.approveAmount(tokenAddressA, kep7.abi, quoteValue.toFixed(0));

    const lqGas = await this.routerContract.methods
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
      await this.routerContract.methods
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
          from: this.address,
          gas: lqGas,
          gasPrice: 250000000000,
        });

    return {
      gas: lqGas,
      send,
    };
  }



}
