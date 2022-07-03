import { isEmptyAddress } from './utils'
import { type DexPair } from '@/types/typechain/swap'
import { type AbiItem } from 'caver-js'
import { Balance, ValueWei, type Address } from './types'
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

  // eslint-disable-next-line max-params
  public async getTokenQuote(
    addrA: Address,
    addrB: Address,
    value: ValueWei<string>,
    which: 'tokenA' | 'tokenB',
  ): Promise<ValueWei> {
    const pairContract = await this.createPairContract(addrA, addrB)
    const token0 = await pairContract.methods.token0().call({
      from: this.selfAddr,
    })
    const reserves = await pairContract.methods.getReserves().call({
      from: this.selfAddr,
    })

    const sortedReserves = (which === 'tokenA' ? token0 !== addrA : token0 === addrA)
      ? [reserves[0], reserves[1]]
      : [reserves[1], reserves[0]]

    return (await this.routerContract.methods.quote(value, sortedReserves[0], sortedReserves[1]).call({
      from: this.selfAddr,
    })) as ValueWei
  }

  // eslint-disable-next-line max-params
  public async getKlayQuote(
    addrA: Address,
    addrB: Address,
    value: ValueWei<string>,
    sort: 'reversed' | 'not-reversed',
  ): Promise<ValueWei> {
    const pairContract = await this.createPairContract(addrA, addrB)
    const reserves = await pairContract.methods.getReserves().call({
      from: this.selfAddr,
    })

    const sortedReserves = sort === 'reversed' ? [reserves[0], reserves[1]] : [reserves[1], reserves[0]]

    return (await this.routerContract.methods.quote(value, sortedReserves[0], sortedReserves[1]).call({
      from: this.selfAddr,
    })) as ValueWei
  }

  public async getPairBalance(addrA: Address, addrB: Address): Promise<{ pairBalance: Balance; userBalance: Balance }> {
    const pairContract = await this.createPairContract(addrA, addrB)

    const pairBalance = (await pairContract.methods.totalSupply().call()) as Balance
    const userBalance = (await pairContract.methods.balanceOf(this.selfAddr).call()) as Balance

    return { pairBalance, userBalance }
  }

  /**
   * If there is no such a pair, returns an empty one (`0x00...`)
   */
  public async getPairAddress(addrA: Address, addrB: Address): Promise<Address> {
    return (await this.factoryContract.methods.getPair(addrA, addrB).call({
      from: this.selfAddr,
    })) as Address
  }

  private async createPairContract(addrA: Address, addrB: Address): Promise<DexPair> {
    const pairAddr = (await this.factoryContract.methods.getPair(addrA, addrB).call({
      from: this.selfAddr,
    })) as Address

    if (isEmptyAddress(pairAddr)) throw new Error('EMPTY_ADDRESS')

    // FIXME where and when to import it?
    const pair = await import('./smartcontracts/pair.json')

    return this.cfg.createContract(pairAddr, pair.abi as AbiItem[]) as unknown as DexPair
  }
}
