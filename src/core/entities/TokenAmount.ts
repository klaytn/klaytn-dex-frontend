import CurrencyAmount from './CurrencyAmount'
import Fraction from './Fraction'
import TokenImpl from './TokenImpl'
import Wei, { WeiAsToken } from './Wei'

import { UniCurrencyAmount, UniToken } from './uni-entities'
import BigNumber from 'bignumber.js'

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
    const token = TokenImpl.fromUni(amount.currency)
    return new TokenAmount(
      token,
      amount.numerator.toString(),
      // uniswap returns RAW fraction value
      BigInt(amount.denominator.toString()) * 10n ** BigInt(token.decimals),
    )
  }

  public toWei(): Wei {
    return new Wei(
      new BigNumber((this.numerator * 10n ** BigInt(this.currency.decimals)).toString()).dividedBy(
        this.denominator.toString(),
      ),
    )
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
