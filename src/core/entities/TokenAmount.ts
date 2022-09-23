import CurrencyAmount from './CurrencyAmount'
import Fraction from './Fraction'
import TokenImpl from './TokenImpl'
import Wei, { WeiAsToken } from './Wei'

import { UniToken, UniCurrencyAmount } from './uni-entities'

export default class TokenAmount extends CurrencyAmount<TokenImpl> {
  public static fromWei(token: TokenImpl, amount: Wei): TokenAmount {
    const { numerator, denominator } = token.amountToFraction(amount.asBigInt)
    return new TokenAmount(token, numerator, denominator)
  }

  public static fromToken(token: TokenImpl, amount: WeiAsToken): TokenAmount {
    const { numerator, denominator } = token.amountToFraction(amount, true)
    return new TokenAmount(token, numerator, denominator)
  }

  public static fromUni(amount: UniCurrencyAmount<UniToken>): TokenAmount {
    return new TokenAmount(
      TokenImpl.fromUni(amount.currency),
      amount.numerator.toString(),
      amount.denominator.toString(),
    )
  }

  public toWei(): Wei {
    return new Wei(this.numerator)
  }

  public toFraction(): Fraction {
    return this.clone()
  }

  public toUni(): UniCurrencyAmount<UniToken> {
    return UniCurrencyAmount.fromFractionalAmount(
      this.currency.toUni(),
      // uniswap assumes we putting in RAW fraction value
      (this.numerator * 10n ** BigInt(this.currency.decimals)).toString(),
      this.denominator.toString(),
    )
  }
}
