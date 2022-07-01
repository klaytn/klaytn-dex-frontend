import { isEmptyAddress } from './utils'
import { type DexPair } from '@/types/typechain/swap'
import { type AbiItem } from 'caver-js'
import { type Address } from './types'
import Config from './Config'

export default class Tokens {
  private readonly cfg: Config

  public constructor(cfg: Config) {
    this.cfg = cfg
  }

  private get selfAddr(): Address {
    return this.cfg.addrs.self
  }

  private get routerContract() {
    return this.cfg.contracts.router
  }

  private get factoryContract() {
    return this.cfg.contracts.factory
  }

  public async getTokenBQuote(addrA: Address, addrB: Address, value: string) {
    const pairContract = await this.createPairContract(addrA, addrB)
    const token0 = await pairContract.methods.token0().call({
      from: this.selfAddr,
    })
    const reserves = await pairContract.methods.getReserves().call({
      from: this.selfAddr,
    })

    const sortedReserves = token0 === addrA ? [reserves[0], reserves[1]] : [reserves[1], reserves[0]]

    return await this.routerContract.methods.quote(value, sortedReserves[0], sortedReserves[1]).call({
      from: this.selfAddr,
    })
  }

  public async getTokenAQuote(addrA: Address, addrB: Address, value: string) {
    const pairContract = await this.createPairContract(addrA, addrB)

    const token0 = await pairContract.methods.token0().call({
      from: this.selfAddr,
    })

    // FIXME meaningless & confusing comment?
    // token0 === addressA => not reserved
    // token0 == addressA => reserved

    const reserves = await pairContract.methods.getReserves().call({
      from: this.selfAddr,
    })

    const sortedReserves = token0 !== addrA ? [reserves[0], reserves[1]] : [reserves[1], reserves[0]]

    return await this.routerContract.methods.quote(value, sortedReserves[0], sortedReserves[1]).call({
      from: this.selfAddr,
    })
  }

  // eslint-disable-next-line max-params
  public async getKlayQuote(addrA: Address, addrB: Address, value: string, sort: 'reversed' | 'not-reversed') {
    const pairContract = await this.createPairContract(addrA, addrB)
    const reserves = await pairContract.methods.getReserves().call({
      from: this.selfAddr,
    })

    const sortedReserves = sort === 'reversed' ? [reserves[0], reserves[1]] : [reserves[1], reserves[0]]

    return await this.routerContract.methods.quote(value, sortedReserves[0], sortedReserves[1]).call({
      from: this.selfAddr,
    })
  }

  public async getPairBalance(addrA: Address, addrB: Address) {
    const pairContract = await this.createPairContract(addrA, addrB)

    const pairBalance = await pairContract.methods.totalSupply().call()
    const userBalance = await pairContract.methods.balanceOf(this.selfAddr).call()

    return { pairBalance, userBalance }
  }

  public async getPairAddress(addrA: Address, addrB: Address) {
    return await this.factoryContract.methods.getPair(addrA, addrB).call({
      from: this.selfAddr,
    })
  }

  private async createPairContract(addrA: Address, addrB: Address) {
    const pairAddr = (await this.factoryContract.methods.getPair(addrA, addrB).call({
      from: this.selfAddr,
    })) as Address

    if (isEmptyAddress(pairAddr)) throw new Error('EMPTY_ADDRESS')

    // FIXME where and when to import it?
    const pair = await import('@/utils/smartcontracts/pair.json')

    return this.cfg.createContract(pairAddr, pair.abi as AbiItem[]) as unknown as DexPair
  }
}
