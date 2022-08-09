import { isEmptyAddress, isNativeToken } from './utils'
import { type DexPair } from '@/types/typechain/swap'
import type { Address, Token, TokenSymbol } from './types'
import Config from './Config'
import { PAIR, KIP7 as KIP7_ABI } from './smartcontracts/abi'
import { TokensPair, TokenType } from '@/utils/pair'
import invariant from 'tiny-invariant'
import { KIP7 } from '@/types/typechain/tokens'
import Wei from './entities/Wei'

export interface GetTokenQuoteProps extends TokensPair<Address> {
  value: Wei
  quoteFor: TokenType
}

export interface PairReserves {
  reserve0: Wei
  reserve1: Wei
}

/**
 * Depending on what token for we are going to compute `quote`,
 * we might swap reserves with each other
 */
function sortReservesForQuote({
  reserves,
  token0,
  tokenA,
  quoteFor,
}: {
  reserves: PairReserves
  token0: Address
  tokenA: Address
  quoteFor: TokenType
}): PairReserves {
  if (quoteFor === 'tokenB' && token0 === tokenA) return reserves
  return { reserve0: reserves.reserve1, reserve1: reserves.reserve0 }
}

/**
 * # Todo
 *
 * - optimize pair contract creation; use the same one for the set of operations
 */
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
  public async getTokenQuote({ tokenA, tokenB, value, quoteFor }: GetTokenQuoteProps): Promise<Wei> {
    const pairContract = await this.createPairContract({ tokenA, tokenB })
    const token0 = (await pairContract.methods.token0().call({
      from: this.addr,
    })) as Address
    const reserves = await this.getPairReserves({ tokenA, tokenB })

    const sortedReserves = sortReservesForQuote({ reserves, token0, tokenA, quoteFor })

    return new Wei(
      await this.routerContract.methods
        .quote(value.asBN, sortedReserves.reserve0.asBN, sortedReserves.reserve1.asBN)
        .call({
          from: this.addr,
        }),
    )
  }

  public async getPairReserves(tokens: TokensPair<Address>): Promise<PairReserves> {
    const contract = await this.createPairContract(tokens)
    const reserves = await contract.methods.getReserves().call({
      from: this.addr,
    })
    return {
      reserve0: new Wei(reserves[0]),
      reserve1: new Wei(reserves[1]),
    }
  }

  /**
   * Fails if there is no such a pair
   */
  public async getPairBalanceOfUser(pair: TokensPair<Address>): Promise<{ totalSupply: Wei; userBalance: Wei }> {
    const pairContract = await this.createPairContract(pair)

    const totalSupply = new Wei(await pairContract.methods.totalSupply().call())
    const userBalance = new Wei(await pairContract.methods.balanceOf(this.addr).call())

    return { totalSupply, userBalance }
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

  public async getTokenBalanceOfUser(token: Address): Promise<Wei> {
    return this.getTokenBalanceOfAddr(token, this.addr)
  }

  public async getTokenBalanceOfAddr(token: Address, balanceOf: Address): Promise<Wei> {
    if (isNativeToken(token)) {
      // we can't get KLAY balance via KIP7 contract, because it returns a balance of WKLAY,
      // which is not correct
      const balance = new Wei(await this.cfg.caver.rpc.klay.getBalance(balanceOf))
      return balance
    }

    const contract = this.cfg.createContract<KIP7>(token, KIP7_ABI)
    const balance = new Wei(await contract.methods.balanceOf(balanceOf).call())
    return balance
  }

  public async createPairContract(pair: TokensPair<Address>): Promise<DexPair> {
    const pairAddr = await this.getPairAddress(pair)
    invariant(!isEmptyAddress(pairAddr), 'Empty address')

    return this.cfg.createContract(pairAddr, PAIR) as unknown as DexPair
  }
}
