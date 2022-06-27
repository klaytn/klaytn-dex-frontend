import type { AbiItem } from 'caver-js'
import { useConfigWithConnectedKaikas } from './config'
import utils from './utils'
import pair from '@/utils/smartcontracts/pair.json'
import type { DexPair } from '@/types/typechain/swap'
import type { Address } from '@/types'

export default class Tokens {
  async getTokenBQuote(addressA: string, addressB: string, value: string) {
    const config = useConfigWithConnectedKaikas()

    const pairAddress = await config.factoryContract.methods
      .getPair(addressA, addressB)
      .call({
        from: config.address,
      })

    if (utils.isEmptyAddress(pairAddress))
      throw new Error('EMPTY_ADDRESS')

    const pairContract = config.createContract(pairAddress, pair.abi as AbiItem[]) as unknown as DexPair
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

    return await config.routerContract.methods
      .quote(value, sortedReserves[0], sortedReserves[1])
      .call({
        from: config.address,
      })
  }

  async getTokenAQuote(addressA: Address, addressB: Address, value: string) {
    const config = useConfigWithConnectedKaikas()

    const pairAddress = await config.factoryContract.methods
      .getPair(addressA, addressB)
      .call({
        from: config.address,
      })

    if (utils.isEmptyAddress(pairAddress))
      throw new Error('EMPTY_ADDRESS')

    const pairContract = config.createContract(pairAddress, pair.abi as AbiItem[]) as unknown as DexPair

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

    return await config.routerContract.methods
      .quote(value, sortedReserves[0], sortedReserves[1])
      .call({
        from: config.address,
      })
  }

  async getKlayQuote(addressA: Address, addressB: Address, value: string, reversed: boolean) {
    const config = useConfigWithConnectedKaikas()

    const pairAddress = await config.factoryContract.methods
      .getPair(addressA, addressB)
      .call({
        from: config.address,
      })

    if (utils.isEmptyAddress(pairAddress))
      throw new Error('EMPTY_ADDRESS')

    const pairContract = config.createContract(pairAddress, pair.abi as AbiItem[]) as unknown as DexPair

    const reserves = await pairContract.methods.getReserves().call({
      from: config.address,
    })

    const sortedReserves = reversed
      ? [reserves[0], reserves[1]]
      : [reserves[1], reserves[0]]

    return await config.routerContract.methods
      .quote(value, sortedReserves[0], sortedReserves[1])
      .call({
        from: config.address,
      })
  }

  async getPairBalance(addressA: Address, addressB: Address) {
    const config = useConfigWithConnectedKaikas()

    const pairAddress = await config.factoryContract.methods
      .getPair(addressA, addressB)
      .call({
        from: config.address,
      })

    if (utils.isEmptyAddress(pairAddress))
      throw new Error('EMPTY_ADDRESS')

    const pairContract = config.createContract(pairAddress, pair.abi as AbiItem[]) as unknown as DexPair

    const pairBalance = await pairContract.methods.totalSupply().call()
    const userBalance = await pairContract.methods
      .balanceOf(config.address)
      .call()

    return { pairBalance, userBalance }
  }

  async getPairAddress(addressA: Address, addressB: Address) {
    const config = useConfigWithConnectedKaikas()

    return await config.factoryContract.methods
      .getPair(addressA, addressB)
      .call({
        from: config.address,
      })
  }
}
