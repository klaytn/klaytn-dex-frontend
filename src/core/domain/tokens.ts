import { isEmptyAddress } from '../utils'
import type { Address, CurrencySymbol, Token } from '../types'
import { Wei } from '../entities'
import CommonContracts from './CommonContracts'
import invariant from 'tiny-invariant'
import { TokenType, TokensPair, map01ToPair } from '@/utils/pair'
import { Agent, AgentPure } from './agent'
import { IsomorphicContract } from '../isomorphic-contract'
import MulticallPure, { CallStruct } from './MulticallPure'
import { Interface, JsonFragment, defaultAbiCoder } from '@ethersproject/abi'
import { BigNumber as EthersBigNumber } from '@ethersproject/bignumber'

export interface GetTokenQuoteProps extends TokensPair<Address> {
  value: Wei
  quoteFor: TokenType
}

export type PairReserves = TokensPair<Wei>

/**
 * Depending on what token for we are going to compute `quote`,
 * we might swap reserves with each other
 */
function sortReservesForQuote({ reserves, quoteFor }: { reserves: PairReserves; quoteFor: TokenType }): [Wei, Wei] {
  return quoteFor === 'tokenB' ? [reserves.tokenA, reserves.tokenB] : [reserves.tokenB, reserves.tokenA]
}

/**
 * # Todo
 *
 * - optimize pair contract creation; use the same one for the set of operations
 */
export class TokensPure {
  #agent: AgentPure
  #contracts: CommonContracts
  #multicall: MulticallPure

  /** For multicall */
  #kip7FunctionData: {
    name: string
    symbol: string
    decimals: string
    balanceOf: (address: Address) => string
  } | null = null

  public constructor(props: { agent: AgentPure; contracts: CommonContracts; multicall: MulticallPure }) {
    this.#agent = props.agent
    this.#contracts = props.contracts
    this.#multicall = props.multicall
  }

  public async getTokenQuote({ tokenA, tokenB, value, quoteFor }: GetTokenQuoteProps): Promise<Wei> {
    const router = this.#contracts.get('router') || (await this.#contracts.init('router'))
    const reserves = await this.getPairReserves({ tokenA, tokenB })
    const sortedReserves = sortReservesForQuote({ reserves, quoteFor })
    return new Wei(await router.quote([value.asStr, sortedReserves[0].asStr, sortedReserves[1].asStr]).call())
  }

  public async getPairReserves(tokens: TokensPair<Address>): Promise<PairReserves> {
    const contract = await this.createPairContract(tokens)
    const [[reserve0, reserve1], token0] = await Promise.all([
      contract
        .getReserves([])
        .call()
        .then((reserves) => [new Wei(reserves[0]), new Wei(reserves[1])] as [Wei, Wei]),
      contract.token0([]).call(),
    ])

    return map01ToPair({ token0: reserve0, token1: reserve1 }, token0 as Address, tokens.tokenA)
  }

  /**
   * If there is no such a pair, returns an empty one (`0x00...`)
   */
  public async getPairAddress({ tokenA, tokenB }: TokensPair<Address>): Promise<Address> {
    const factory = this.#contracts.get('factory') || (await this.#contracts.init('factory'))
    const addr = (await factory.getPair([tokenA, tokenB]).call()) as Address
    return addr
  }

  public async getTokensBunch(addresses: Address[]): Promise<Token[]> {
    const fns = this.#kip7FunctionData || (await this.initKip7FunctionData())

    const calls = addresses.flatMap<CallStruct>((a) => [
      { target: a, callData: fns.name },
      { target: a, callData: fns.symbol },
      { target: a, callData: fns.decimals },
    ])

    const { returnData } = await this.#multicall.aggregate(calls)

    const tokens = addresses.map<Token>((a, i) => {
      const [nameRaw, symbolRaw, decimalsRaw] = returnData.slice(i * 3, i * 3 + 3)
      const [name] = defaultAbiCoder.decode(['string'], nameRaw) as [string]
      const [symbol] = defaultAbiCoder.decode(['string'], symbolRaw) as [CurrencySymbol]
      const [decimals] = defaultAbiCoder.decode(['uint'], decimalsRaw) as [EthersBigNumber]
      return { address: a, name, symbol, decimals: decimals.toNumber() }
    })

    return tokens
  }

  public async getToken(address: Address): Promise<Token> {
    const contract = await this.#agent.createContract(address, 'kip7')
    const [name, symbol, decimals] = await Promise.all([
      contract.name([]).call(),
      contract.symbol([]).call() as Promise<CurrencySymbol>,
      contract
        .decimals([])
        .call()
        .then((x) => Number(x)),
    ])
    return { address, name, symbol, decimals }
  }

  public async getBalancesBunch(calls: { address: Address; balanceOf: Address }[]): Promise<Wei[]> {
    const fns = this.#kip7FunctionData || (await this.initKip7FunctionData())

    const { returnData } = await this.#multicall.aggregate(
      calls.map((x) => ({ target: x.address, callData: fns.balanceOf(x.balanceOf) })),
    )

    const mapped = returnData.map((hex) => {
      const [decoded] = defaultAbiCoder.decode(['uint256'], hex) as [EthersBigNumber]
      return new Wei(decoded)
    })

    return mapped
  }

  public async getTokenBalanceOfAddr(token: Address, balanceOf: Address): Promise<Wei> {
    const contract = await this.#agent.createContract(token, 'kip7')
    const balance = await contract.balanceOf([balanceOf]).call()
    return new Wei(balance)
  }

  public async createPairContract(pair: TokensPair<Address>): Promise<IsomorphicContract<'pair'>> {
    const pairAddr = await this.getPairAddress(pair)
    invariant(!isEmptyAddress(pairAddr), 'Empty address')
    return this.#agent.createContract(pairAddr, 'pair')
  }

  public async pairAddressToTokensPair(pair: Address): Promise<TokensPair<Address>> {
    const contract = await this.#agent.createContract(pair, 'pair')
    const [tokenA, tokenB] = (await Promise.all([contract.token0([]).call(), contract.token1([]).call()])) as [
      Address,
      Address,
    ]
    return { tokenA, tokenB }
  }

  private async initKip7FunctionData() {
    const fragments = this.#agent.abi.get('kip7') || (await this.#agent.abi.load('kip7'))
    const iface = new Interface(fragments as JsonFragment[])
    this.#kip7FunctionData = {
      name: iface.encodeFunctionData('name', []),
      symbol: iface.encodeFunctionData('symbol', []),
      decimals: iface.encodeFunctionData('decimals', []),
      balanceOf: (a) => iface.encodeFunctionData('balanceOf', [a]),
    }
    return this.#kip7FunctionData
  }
}

export class Tokens extends TokensPure {
  #agent: Agent

  public constructor(props: { agent: Agent; contracts: CommonContracts; multicall: MulticallPure }) {
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
    const contract = await this.createPairContract(pair)
    const totalSupply = new Wei(await contract.totalSupply([]).call())
    const userBalance = new Wei(await contract.balanceOf([this.address]).call())
    return { totalSupply, userBalance }
  }
}
