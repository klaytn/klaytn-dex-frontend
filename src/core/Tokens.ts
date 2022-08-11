import { isEmptyAddress } from './utils'
import { type DexPair } from './typechain'
import type { Address, Token, TokenSymbol } from './types'
import { UserKlaytnAgent } from './Wallet'
import Wei from './Wei'
import BaseContracts from './BaseContracts'
import invariant from 'tiny-invariant'
import { TokensPair, TokenType } from '@/utils/pair'

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
  #wallet: UserKlaytnAgent
  #contracts: BaseContracts

  public constructor(props: { wallet: UserKlaytnAgent; contracts: BaseContracts }) {
    this.#wallet = props.wallet
    this.#contracts = props.contracts
  }

  private get addr(): Address {
    return this.#wallet.address
  }

  private get routerContract() {
    return this.#contracts.router
  }

  private get factoryContract() {
    return this.#contracts.factory
  }

  // eslint-disable-next-line max-params
  public async getTokenQuote({ tokenA, tokenB, value, quoteFor }: GetTokenQuoteProps): Promise<Wei> {
    const pairContract = await this.createPairContract({ tokenA, tokenB })
    const token0 = (await pairContract.token0()) as Address
    const reserves = await this.getPairReserves({ tokenA, tokenB })

    const sortedReserves = sortReservesForQuote({ reserves, token0, tokenA, quoteFor })

    return new Wei(
      await this.routerContract.quote(
        value.asBigInt,
        sortedReserves.reserve0.asBigInt,
        sortedReserves.reserve1.asBigInt,
      ),
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
   * Fails if there is no such a pair
   */
  public async getPairBalanceOfUser(pair: TokensPair<Address>): Promise<{ totalSupply: Wei; userBalance: Wei }> {
    const pairContract = await this.createPairContract(pair)

    const totalSupply = new Wei(await pairContract.totalSupply())
    const userBalance = new Wei(await pairContract.balanceOf(this.addr))

    return { totalSupply, userBalance }
  }

  /**
   * If there is no such a pair, returns an empty one (`0x00...`)
   */
  public async getPairAddress({ tokenA, tokenB }: TokensPair<Address>): Promise<Address> {
    const addr = (await this.factoryContract.getPair(tokenA, tokenB)) as Address
    return addr
  }

  public async getToken(addr: Address): Promise<Token> {
    const contract = await this.#wallet.base.createContract(addr, 'kip7')
    const [name, symbol, decimals] = await Promise.all([
      contract.name(),
      contract.symbol() as Promise<TokenSymbol>,
      contract.decimals(),
    ])
    return { address: addr, name, symbol, decimals }
  }

  public async getTokenBalanceOfAddr(token: Address, balanceOf: Address): Promise<Wei> {
    const balance = await (await this.#wallet.base.createContract(token, 'kip7')).balanceOf(balanceOf)
    return new Wei(balance)
  }

  public async createPairContract(pair: TokensPair<Address>): Promise<DexPair> {
    const pairAddr = await this.getPairAddress(pair)
    invariant(!isEmptyAddress(pairAddr), 'Empty address')
    return this.#wallet.base.createContract(pairAddr, 'pair')
  }
}
