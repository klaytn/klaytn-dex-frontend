import { asWei, isEmptyAddress } from './utils'
import { type DexPair } from '@/types/typechain/swap'
import { type Balance, type ValueWei, type Address, WeiNumStrBn } from './types'
import Config from './Config'
import { PAIR } from './smartcontracts/abi'
import { TokensPair, TokenType } from '@/utils/pair'
import invariant from 'tiny-invariant'

export interface GetTokenQuoteProps extends TokensPair<Address> {
  value: WeiNumStrBn
  quoteFor: TokenType
}

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
  public async getTokenQuote({ tokenA, tokenB, value, quoteFor }: GetTokenQuoteProps): Promise<ValueWei<string>> {
    const pairContract = await this.createPairContract({ tokenA, tokenB })
    const token0 = await pairContract.methods.token0().call({
      from: this.selfAddr,
    })
    const reserves = await pairContract.methods.getReserves().call({
      from: this.selfAddr,
    })

    const sortedReserves = (quoteFor === 'tokenA' ? token0 !== tokenA : token0 === tokenA)
      ? [reserves[0], reserves[1]]
      : [reserves[1], reserves[0]]

    return asWei(
      await this.routerContract.methods.quote(value, sortedReserves[0], sortedReserves[1]).call({
        from: this.selfAddr,
      }),
    )
  }

  /**
   * Fails if there is no such a pair
   */
  public async getPairBalance(pair: TokensPair<Address>): Promise<{ pairBalance: Balance; userBalance: Balance }> {
    const pairContract = await this.createPairContract(pair)

    const pairBalance = (await pairContract.methods.totalSupply().call()) as Balance
    const userBalance = (await pairContract.methods.balanceOf(this.selfAddr).call()) as Balance

    return { pairBalance, userBalance }
  }

  /**
   * If there is no such a pair, returns an empty one (`0x00...`)
   */
  public async getPairAddress({ tokenA, tokenB }: TokensPair<Address>): Promise<Address> {
    return (await this.factoryContract.methods.getPair(tokenA, tokenB).call({
      from: this.selfAddr,
    })) as Address
  }

  private async createPairContract(pair: TokensPair<Address>): Promise<DexPair> {
    const pairAddr = await this.getPairAddress(pair)
    invariant(!isEmptyAddress(pairAddr), 'Empty address')

    return this.cfg.createContract(pairAddr, PAIR) as unknown as DexPair
  }
}
