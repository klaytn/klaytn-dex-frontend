import invariant from 'tiny-invariant'
import CurrencyAmount from './CurrencyAmount'
import Token from './Token'
import Wei from './Wei'
import { BigNumberIsh } from '../types'

export default class TokenAmount extends CurrencyAmount {
  public readonly token: Token

  public constructor(token: Token, amount: BigNumberIsh) {
    super(token, amount)
    this.token = token
  }

  public get asWei(): Wei {
    return new Wei(this.numerator)
  }

  public plus(other: TokenAmount): TokenAmount {
    invariant(this.token.equals(other.token), 'TOKEN')
    return new TokenAmount(this.token, this.raw.plus(other.raw))
  }

  public minus(other: TokenAmount): TokenAmount {
    invariant(this.token.equals(other.token), 'TOKEN')
    return new TokenAmount(this.token, this.raw.minus(other.raw))
  }
}
