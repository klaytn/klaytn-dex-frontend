import { asWei, isEmptyAddress, isNativeToken } from './utils'
import { type DexPair } from '@/types/typechain/swap'
import { type Balance, type ValueWei, type Address, WeiNumStrBn, Token, TokenSymbol } from './types'
import Config from './Config'
import { PAIR, KIP7 as KIP7_ABI } from './smartcontracts/abi'
import { TokensPair, TokenType } from '@/utils/pair'
import invariant from 'tiny-invariant'
import { KIP7 } from '@/types/typechain/tokens'

export interface GetTokenQuoteProps extends TokensPair<Address> {
  value: WeiNumStrBn
  quoteFor: TokenType
}

export default class Tokens {
  private readonly cfg: Config

  public constructor(cfg: Config) {
    this.cfg = cfg
  }

  private get addr(): Address {
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
      from: this.addr,
    })
    const reserves = await pairContract.methods.getReserves().call({
      from: this.addr,
    })

    const sortedReserves = (quoteFor === 'tokenA' ? token0 !== tokenA : token0 === tokenA)
      ? [reserves[0], reserves[1]]
      : [reserves[1], reserves[0]]

    return asWei(
      await this.routerContract.methods.quote(value, sortedReserves[0], sortedReserves[1]).call({
        from: this.addr,
      }),
    )
  }

  /**
   * Fails if there is no such a pair
   */
  public async getPairBalance(pair: TokensPair<Address>): Promise<{ pairBalance: Balance; userBalance: Balance }> {
    const pairContract = await this.createPairContract(pair)

    const pairBalance = (await pairContract.methods.totalSupply().call()) as Balance
    const userBalance = (await pairContract.methods.balanceOf(this.addr).call()) as Balance

    return { pairBalance, userBalance }
  }

  /**
   * If there is no such a pair, returns an empty one (`0x00...`)
   */
  public async getPairAddress({ tokenA, tokenB }: TokensPair<Address>): Promise<Address> {
    return (await this.factoryContract.methods.getPair(tokenA, tokenB).call({
      from: this.addr,
    })) as Address
  }

  public async getToken(addr: Address): Promise<Token> {
    const contract = this.cfg.createContract<KIP7>(addr, KIP7_ABI)
    const [name, symbol, decimals] = await Promise.all([
      contract.methods.name().call(),
      contract.methods.symbol().call() as Promise<TokenSymbol>,
      contract.methods
        .decimals()
        .call()
        .then((x) => Number(x)),
    ])
    return { address: addr, name, symbol, decimals }
  }

  public async getTokenBalanceOfUser(token: Address): Promise<Balance> {
    return this.getTokenBalanceOfAddr(token, this.addr)
  }

  public async getTokenBalanceOfAddr(token: Address, balanceOf: Address): Promise<Balance> {
    if (isNativeToken(token)) {
      // we can't get KLAY balance via KIP7 contract, because it returns a balance of WKLAY,
      // which is not correct
      const balance = (await this.cfg.caver.rpc.klay.getBalance(balanceOf)) as Balance
      return balance
    }

    const contract = this.cfg.createContract<KIP7>(token, KIP7_ABI)
    const balance = (await contract.methods.balanceOf(balanceOf).call()) as Balance
    return balance
  }

  private async createPairContract(pair: TokensPair<Address>): Promise<DexPair> {
    const pairAddr = await this.getPairAddress(pair)
    invariant(!isEmptyAddress(pairAddr), 'Empty address')

    return this.cfg.createContract(pairAddr, PAIR) as unknown as DexPair
  }
}
