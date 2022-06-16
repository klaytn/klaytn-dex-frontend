import config from './Config'

export default class Swap {
  async getAmountOut(addressA, addressB, value) {
    return await config.routerContract.methods
      .getAmountsOut(value, [addressA, addressB])
      .call()
  }

  async getAmountIn(addressA, addressB, value) {
    return await config.routerContract.methods
      .getAmountsIn(value, [addressA, addressB])
      .call()
  }

  async swapExactTokensForTokens({ addressA, addressB, valueA, valueB }) {
    const deadLine = Math.floor(Date.now() / 1000 + 300)
    const swapGas = await config.routerContract.methods
      .swapExactTokensForTokens(
        valueA,
        valueB,
        [addressA, addressB],
        config.address,
        deadLine,
      )
      .estimateGas()

    const send = async () =>
      await config.routerContract.methods
        .swapExactTokensForTokens(
          valueA,
          valueB,
          [addressA, addressB],
          config.address,
          deadLine,
        )
        .send({
          from: config.address,
          gas: swapGas,
          gasPrice: 250000000000,
        })

    return {
      swapGas,
      send,
    }
  }

  async swapTokensForExactTokens({ addressA, addressB, valueA, valueB }) {
    const deadLine = Math.floor(Date.now() / 1000 + 300)
    const swapGas = await config.routerContract.methods
      .swapTokensForExactTokens(
        valueB,
        valueA,
        [addressA, addressB],
        config.address,
        deadLine,
      )
      .estimateGas()

    const send = async () =>
      await config.routerContract.methods
        .swapTokensForExactTokens(
          valueB,
          valueA,
          [addressA, addressB],
          config.address,
          deadLine,
        )
        .send({
          from: config.address,
          gas: swapGas,
          gasPrice: 250000000000,
        })

    return { swapGas, send }
  }

  async swapExactTokensForETH({ addressA, addressB, valueA, valueB }) {
    const deadLine = Math.floor(Date.now() / 1000 + 300)

    const swapGas = await config.routerContract.methods
      .swapExactTokensForETH(
        valueB,
        valueA,
        [addressB, addressA],
        config.address,
        deadLine,
      )
      .estimateGas({
        from: config.address,
        gasPrice: 250000000000,
      })

    const send = async () =>
      await config.routerContract.methods
        .swapExactTokensForETH(
          valueB,
          valueA,
          [addressB, addressA],
          config.address,
          deadLine,
        )
        .send({
          from: config.address,
          gas: swapGas,
          gasPrice: 250000000000,
        })
    return { gas: swapGas, send }
  }

  async swapExactETHForTokens({ addressA, addressB, valueA, valueB }) {
    const deadLine = Math.floor(Date.now() / 1000 + 300)

    const swapGas = await config.routerContract.methods
      .swapExactETHForTokens(
        valueA,
        [addressB, addressA],
        config.address,
        deadLine,
      )
      .estimateGas({
        value: valueB,
        from: config.address,
        gasPrice: 250000000000,
      })

    const send = async () =>
      await config.routerContract.methods
        .swapExactETHForTokens(
          valueA,
          [addressB, addressA],
          config.address,
          deadLine,
        )
        .send({
          value: valueB,
          from: config.address,
          gas: swapGas,
          gasPrice: 250000000000,
        })
    return { gas: swapGas, send }
  }

  async swapEthForExactTokens({ amountOut, from, to, amountIn }) {
    const deadLine = Math.floor(Date.now() / 1000 + 300)
    const swapGas = await config.routerContract.methods
      .swapETHForExactTokens(amountOut, [to, from], config.address, deadLine)
      .estimateGas({
        value: amountIn,
        from: config.address,
        gasPrice: 250000000000,
      })

    await config.routerContract.methods
      .swapETHForExactTokens(amountOut, [to, from], config.address, deadLine)
      .send({
        value: amountIn,
        gas: swapGas,
        from: config.address,
        gasPrice: 250000000000,
      })
  }

  async swapTokensForExactETH({ amountOut, amountInMax, from, to }) {
    const deadLine = Math.floor(Date.now() / 1000 + 300)
    const swapGas = await config.routerContract.methods
      .swapTokensForExactETH(
        amountOut,
        amountInMax,
        [from, to],
        config.address,
        deadLine,
      )
      .estimateGas({
        from: config.address,
        gasPrice: 250000000000,
      })
    const send = async () =>
      await config.routerContract.methods
        .swapTokensForExactETH(
          amountOut,
          amountInMax,
          [from, to],
          config.address,
          deadLine,
        )
        .send({
          from: config.address,
          gas: swapGas,
          gasPrice: 250000000000,
        })

    return { send, swapGas }
  }
}
