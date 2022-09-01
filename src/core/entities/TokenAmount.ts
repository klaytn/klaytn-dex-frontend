import invariant from 'tiny-invariant'
import { BigNumberIsh } from '../types'
import CurrencyAmount from './CurrencyAmount'
import Fraction from './Fraction'
import TokenImpl from './TokenImpl'
import Wei, { WeiAsToken } from './Wei'

export default class TokenAmount extends CurrencyAmount {
  public static fromWei(token: TokenImpl, amount: Wei): TokenAmount {
    return new TokenAmount(token, amount.asBigInt, true)
  }

  public static fromToken(token: TokenImpl, amount: WeiAsToken): TokenAmount {
    return new TokenAmount(token, amount, false)
  }

  public readonly token: TokenImpl

  private constructor(token: TokenImpl, amount: BigNumberIsh, withDecimals = true) {
    super(token, amount, withDecimals)
    this.token = token
  }

  public toWei(): Wei {
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

  public toFraction(): Fraction {
    return this.clone()
  }
}
