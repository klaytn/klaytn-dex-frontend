import config from './Config'
import utils from './utils'
import pair from '@/utils/smartcontracts/pair.json'

export default class Tokens {
  async getTokenBQuote(addressA, addressB, value) {
    const pairAddress = await config.factoryContract.methods
      .getPair(addressA, addressB)
      .call({
        from: config.address,
      })

    if (utils.isEmptyAddress(pairAddress))
      throw new Error('EMPTY_ADDRESS')

    const pairContract = config.createContract(pairAddress, pair.abi)
    const token0 = await pairContract.methods.token0().call({
      from: config.address,
    })

    const reserves = await pairContract.methods.getReserves().call({
      from: config.address,
    })

    const sortedReserves
      = token0 === addressA
        ? [reserves[0], reserves[1]]
        : [reserves[1], reserves[0]]

    console.log({ sortedReserves })

    return await config.routerContract.methods
      .quote(value, ...sortedReserves)
      .call({
        from: config.address,
      })
  }

  async getTokenAQuote(addressA, addressB, value) {
    const pairAddress = await config.factoryContract.methods
      .getPair(addressA, addressB)
      .call({
        from: config.address,
      })

    if (utils.isEmptyAddress(pairAddress))
      throw new Error('EMPTY_ADDRESS')

    const pairContract = config.createContract(pairAddress, pair.abi)

    const token0 = await pairContract.methods.token0().call({
      from: config.address,
    })

    // token0 === addressA => not reserved
    // token0 == addressA => reserved

    const reserves = await pairContract.methods.getReserves().call({
      from: config.address,
    })

    const sortedReserves
      = token0 !== addressA
        ? [reserves[0], reserves[1]]
        : [reserves[1], reserves[0]]

    console.log({ sortedReserves })

    return await config.routerContract.methods
      .quote(value, ...sortedReserves)
      .call({
        from: config.address,
      })
  }

  async getKlayQuote(addressA, addressB, value, reversed) {
    const pairAddress = await config.factoryContract.methods
      .getPair(addressA, addressB)
      .call({
        from: config.address,
      })

    if (utils.isEmptyAddress(pairAddress))
      throw new Error('EMPTY_ADDRESS')

    const pairContract = config.createContract(pairAddress, pair.abi)

    const reserves = await pairContract.methods.getReserves().call({
      from: config.address,
    })

    const sortedReserves = reversed
      ? [reserves[0], reserves[1]]
      : [reserves[1], reserves[0]]

    return await config.routerContract.methods
      .quote(value, ...sortedReserves)
      .call({
        from: config.address,
      })
  }

  async getPairBalance(addressA, addressB) {
    const pairAddress = await config.factoryContract.methods
      .getPair(addressA, addressB)
      .call({
        from: config.address,
      })

    if (utils.isEmptyAddress(pairAddress))
      throw new Error('EMPTY_ADDRESS')

    const pairContract = config.createContract(pairAddress, pair.abi)

    const pairBalance = await pairContract.methods.totalSupply().call()
    const userBalance = await pairContract.methods
      .balanceOf(config.address)
      .call()

    return { pairBalance, userBalance }
  }

  async getPairAddress(addressA, addressB) {
    return await config.factoryContract.methods
      .getPair(addressA, addressB)
      .call({
        from: config.address,
      })
  }
}
