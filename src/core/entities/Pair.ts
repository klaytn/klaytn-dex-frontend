import TokenImpl from './TokenImpl'
import TokenAmount from './TokenAmount'
import Price from './Price'

export default class Pair {
  public readonly liquidityToken: TokenImpl
  private readonly tokenAmounts: [TokenAmount, TokenAmount]

  public constructor({
    liquidityToken,
    token0Amount,
    token1Amount,
  }: {
    liquidityToken: TokenImpl
    token0Amount: TokenAmount
    token1Amount: TokenAmount
  }) {
    this.liquidityToken = liquidityToken
    this.tokenAmounts = [token0Amount, token1Amount]
  }

  public get token0Price(): Price {
    return new Price({
      baseCurrency: this.token0,
      quoteCurrency: this.token1,
      denominator: this.tokenAmounts[0].raw,
      numerator: this.tokenAmounts[1].raw,
    })
  }

  public get token1Price(): Price {
    return new Price({
      baseCurrency: this.token1,
      quoteCurrency: this.token0,
      denominator: this.tokenAmounts[1].raw,
      numerator: this.tokenAmounts[0].raw,
    })
  }

  public get token0(): TokenImpl {
    return this.tokenAmounts[0].token
  }

  public get token1(): TokenImpl {
    return this.tokenAmounts[1].token
  }

  public get reserve0(): TokenAmount {
    return this.tokenAmounts[0]
  }

  public get reserve1(): TokenAmount {
    return this.tokenAmounts[1]
  }
}
