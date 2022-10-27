import TokenImpl from './TokenImpl'
import TokenAmount from './TokenAmount'
import Price from './Price'
import { TokensPair } from '@/utils/pair'

import { UniPair } from './uni-entities'
import { Writable } from 'type-fest'

export default class Pair {
  public static fromUni(pair: UniPair): Pair {
    return new Pair({
      token0: TokenAmount.fromUni(pair.reserve0),
      token1: TokenAmount.fromUni(pair.reserve1),
      liquidityToken: TokenImpl.fromUni(pair.liquidityToken),
    })
  }

  #tokenAmounts: TokensPair<TokenAmount>
  #liquidityToken: TokenImpl

  public constructor({
    token0,
    token1,
    liquidityToken,
  }: {
    token0: TokenAmount
    token1: TokenAmount
    liquidityToken: TokenImpl
  }) {
    this.#tokenAmounts = { tokenA: token0, tokenB: token1 }
    this.#liquidityToken = liquidityToken
  }

  public get token0Price(): Price {
    return new Price({
      baseCurrency: this.token0,
      quoteCurrency: this.token1,
      denominator: this.#tokenAmounts.tokenA.numerator,
      numerator: this.#tokenAmounts.tokenB.numerator,
    })
  }

  public get token1Price(): Price {
    return new Price({
      baseCurrency: this.token1,
      quoteCurrency: this.token0,
      denominator: this.#tokenAmounts.tokenB.numerator,
      numerator: this.#tokenAmounts.tokenA.numerator,
    })
  }

  public get token0(): TokenImpl {
    return this.#tokenAmounts.tokenA.currency
  }

  public get token1(): TokenImpl {
    return this.#tokenAmounts.tokenB.currency
  }

  public get reserve0(): TokenAmount {
    return this.#tokenAmounts.tokenA
  }

  public get reserve1(): TokenAmount {
    return this.#tokenAmounts.tokenB
  }

  public toUni(): UniPair {
    const pair = new UniPair(this.reserve0.toUni(), this.reserve1.toUni())
    ;(pair as Writable<UniPair, 'liquidityToken'>).liquidityToken = this.#liquidityToken.toUni()
    return pair
  }
}
