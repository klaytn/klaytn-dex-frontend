import invariant from 'tiny-invariant'
import CurrencyAmount from './CurrencyAmount'
import Token from './Token'
import Wei from './Wei'
import { BigNumberIsh } from '../types'

export default class TokenAmount extends CurrencyAmount {
  public static fromWei(token: Token, amount: BigNumberIsh): TokenAmount {
    return new TokenAmount(token, amount, true)
  }

  public readonly token: Token

  public constructor(token: Token, amount: BigNumberIsh, wei = false) {
    super(token, amount, wei)
    this.token = token
  }

  public get asWei(): Wei {
    return new Wei(this.numerator)
  }

  public plus(other: TokenAmount): TokenAmount {
    invariant(this.token.equals(other.token), 'TOKEN')
    return new TokenAmount(this.token, this.raw + other.raw, true)
  }

  public minus(other: TokenAmount): TokenAmount {
    invariant(this.token.equals(other.token), 'TOKEN')
    return new TokenAmount(this.token, this.raw - other.raw, true)
  }
}
