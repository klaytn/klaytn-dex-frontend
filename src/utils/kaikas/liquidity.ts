import config from './Config'

export default class Liquidity {
  async addLiquidityAmountOutForExistPair({
    tokenBValue,
    tokenAValue,
    tokenAddressA,
    tokenAddressB,
    amountAMin,
    deadLine,
  }) {
    const params = {
      tokenAAddress: tokenAddressA,
      tokenBAddress: tokenAddressB,
      tokenAValue: tokenAValue.toFixed(0),
      tokenBValue: tokenBValue.toFixed(0),
      amountAMin: amountAMin.toFixed(0),
      amountBMin: tokenBValue
        .minus(tokenBValue.dividedToIntegerBy(100))
        .toFixed(0),
      userAddress: config.address,
      deadLine,
    }

    const lqGas = await config.routerContract.methods
      .addLiquidity(
        params.tokenAAddress,
        params.tokenBAddress,
        params.tokenAValue,
        params.tokenBValue,
        params.amountAMin,
        params.amountBMin,
        params.userAddress,
        params.deadLine,
      )
      .estimateGas()
    console.log({ lqGas })

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
          params.deadLine,
        )
        .send({
          from: config.address,
          gas: lqGas,
          gasPrice: 250000000000,
        })

    return {
      gas: lqGas,
      send,
    }
  }

  async addLiquidityAmountInForExistPair({
    tokenBValue,
    tokenAValue,
    tokenAddressA,
    tokenAddressB,
    amountBMin,
    deadLine,
  }) {
    const params = {
      tokenAAddress: tokenAddressA,
      tokenBAddress: tokenAddressB,
      tokenAValue: tokenAValue.toFixed(0),
      tokenBValue: tokenBValue.toFixed(0),
      amountAMin: tokenAValue
        .minus(tokenAValue.dividedToIntegerBy(100))
        .toFixed(0),
      amountBMin: amountBMin.toFixed(0),
      userAddress: config.address,
      deadLine,
    }

    const lqGas = await config.routerContract.methods
      .addLiquidity(
        params.tokenBAddress,
        params.tokenAAddress,
        params.tokenBValue,
        params.tokenAValue,
        params.amountBMin,
        params.amountAMin,
        params.userAddress,
        params.deadLine,
      )
      .estimateGas()

    const send = async () =>
      await config.routerContract.methods
        .addLiquidity(
          params.tokenBAddress,
          params.tokenAAddress,
          params.tokenBValue,
          params.tokenAValue,
          params.amountBMin,
          params.amountAMin,
          params.userAddress,
          params.deadLine,
        )
        .send({
          from: config.address,
          gas: lqGas,
          gasPrice: 250000000000,
        })

    return {
      gas: lqGas,
      send,
    }
  }

  async addLiquidityKlayForExistsPair({
    tokenAValue,
    tokenBValue,
    addressA,
    amountAMin,
    deadLine,
  }) {
    const params = {
      addressA,
      tokenAValue: tokenAValue.toFixed(0),
      amountAMin: amountAMin.toFixed(0),
      amountBMin: tokenBValue
        .minus(tokenBValue.dividedToIntegerBy(100).toFixed(0))
        .toFixed(0),
      address: config.address,
      deadLine,
    }

    const lqETHGas = await config.routerContract.methods
      .addLiquidityETH(
        params.addressA,
        params.tokenAValue,
        params.amountAMin,
        params.amountBMin,
        params.address,
        params.deadLine,
      )
      .estimateGas({
        from: config.address,
        gasPrice: 250000000000,
        value: tokenBValue.toFixed(0),
      })

    const send = async () =>
      await config.routerContract.methods
        .addLiquidityETH(
          params.addressA,
          params.tokenAValue,
          params.amountAMin,
          params.amountBMin,
          params.address,
          params.deadLine,
        )
        .send({
          from: config.address,
          gasPrice: 250000000000,
          gas: lqETHGas,
          value: tokenBValue.toFixed(0),
        })
    console.log({ lqETHGas })

    return { gas: lqETHGas, send }
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
      tokenAValue: tokenAValue.toFixed(0),
      amountAMin: amountAMin.toFixed(0),
      amountBMin: amountBMin.toFixed(0), // KLAY
      deadLine,
      address: config.address,
    }

    const lqETHGas = await config.routerContract.methods
      .addLiquidityETH(
        params.addressA,
        params.tokenAValue,
        params.amountAMin,
        params.amountBMin,
        params.address,
        params.deadLine,
      )
      .estimateGas({
        from: config.address,
        gasPrice: 250000000000,
        value: tokenBValue.toFixed(0),
      })

    const send = async () =>
      await config.routerContract.methods
        .addLiquidityETH(
          params.addressA,
          params.tokenAValue,
          params.amountAMin,
          params.amountBMin,
          params.address,
          params.deadLine,
        )
        .send({
          from: config.address,
          gasPrice: 250000000000,
          value: tokenBValue.toFixed(0),
          gas: lqETHGas,
        })

    console.log({ lqETHGas })
    return { gas: lqETHGas, send }
  }
}
