import { isEmptyAddress } from '../utils'
import { type DexPair } from '../typechain'
import type { Address, Token, TokenSymbol } from '../types'
import Wei from './Wei'
import CommonContracts from './CommonContracts'
import invariant from 'tiny-invariant'
import { TokensPair, TokenType } from '@/utils/pair'
import { AgentAnon, Agent } from './agent'

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
export class TokensAnon {
  #agent: AgentAnon
  #contracts: CommonContracts

  public constructor(props: { agent: AgentAnon; contracts: CommonContracts }) {
    this.#agent = props.agent
    this.#contracts = props.contracts
  }

  protected get router() {
    return this.#contracts.router
  }

  protected get factory() {
    return this.#contracts.factory
  }

  public async getTokenQuote({ tokenA, tokenB, value, quoteFor }: GetTokenQuoteProps): Promise<Wei> {
    const pairContract = await this.createPairContract({ tokenA, tokenB })
    const token0 = (await pairContract.token0()) as Address
    const reserves = await this.getPairReserves({ tokenA, tokenB })

    const sortedReserves = sortReservesForQuote({ reserves, token0, tokenA, quoteFor })

    return new Wei(
      await this.router.quote(value.asBigInt, sortedReserves.reserve0.asBigInt, sortedReserves.reserve1.asBigInt),
    )
  }

  public async getPairReserves(tokens: TokensPair<Address>): Promise<PairReserves> {
    const contract = await this.createPairContract(tokens)
    const reserves = await contract.getReserves()
    return {
      reserve0: new Wei(reserves[0]),
      reserve1: new Wei(reserves[1]),
    }
  }

  /**
   * If there is no such a pair, returns an empty one (`0x00...`)
   */
  public async getPairAddress({ tokenA, tokenB }: TokensPair<Address>): Promise<Address> {
    const addr = (await this.factory.getPair(tokenA, tokenB)) as Address
    return addr
  }

  public async getToken(addr: Address): Promise<Token> {
    const contract = await this.#agent.createContract(addr, 'kip7')
    const [name, symbol, decimals] = await Promise.all([
      contract.name(),
      contract.symbol() as Promise<TokenSymbol>,
      contract.decimals(),
    ])
    return { address: addr, name, symbol, decimals }
  }

  public async getTokenBalanceOfAddr(token: Address, balanceOf: Address): Promise<Wei> {
    const balance = await (await this.#agent.createContract(token, 'kip7')).balanceOf(balanceOf)
    return new Wei(balance)
  }

  public async createPairContract(pair: TokensPair<Address>): Promise<DexPair> {
    const pairAddr = await this.getPairAddress(pair)
    invariant(!isEmptyAddress(pairAddr), 'Empty address')
    return this.#agent.createContract(pairAddr, 'pair')
  }
}

export class Tokens extends TokensAnon {
  #agent: Agent

  public constructor(props: { agent: Agent; contracts: CommonContracts }) {
    super(props)
    this.#agent = props.agent
  }

  private get address() {
    return this.#agent.address
  }

  public async getTokenBalanceOfUser(token: Address): Promise<Wei> {
    return this.getTokenBalanceOfAddr(token, this.address)
  }

  public async getKlayBalance(): Promise<Wei> {
    return this.#agent.getBalance(this.address)
  }

  /**
   * Fails if there is no such a pair
   */
  public async getPairBalanceOfUser(pair: TokensPair<Address>): Promise<{ totalSupply: Wei; userBalance: Wei }> {
    const pairContract = await this.createPairContract(pair)

    const totalSupply = new Wei(await pairContract.totalSupply())
    const userBalance = new Wei(await pairContract.balanceOf(this.address))

    return { totalSupply, userBalance }
  }
}
