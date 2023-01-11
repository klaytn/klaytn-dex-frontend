import invariant from 'tiny-invariant'
import { BigNumberIsh } from '../types'
import Currency from './Currency'
import Fraction from './Fraction'

import { UniPrice, UniToken } from './uni-entities'
import TokenImpl from './TokenImpl'

export default class Price extends Fraction {
  public static fromUni(price: UniPrice<UniToken, UniToken>): Price {
    return new Price({
      baseCurrency: TokenImpl.fromUni(price.baseCurrency),
      quoteCurrency: TokenImpl.fromUni(price.quoteCurrency),
      denominator: price.denominator.toString(),
      numerator: price.numerator.toString(),
    })
  }

  public readonly baseCurrency: Currency
  public readonly quoteCurrency: Currency

  public constructor({
    baseCurrency,
    quoteCurrency,
    denominator,
    numerator,
  }: {
    baseCurrency: Currency
    quoteCurrency: Currency
    denominator: BigNumberIsh
    numerator: BigNumberIsh
  }) {
    super(numerator, denominator)

    this.baseCurrency = baseCurrency
    this.quoteCurrency = quoteCurrency
  }

  public multipliedBy(other: Price): Price {
    invariant(this.quoteCurrency.equals(other.baseCurrency), 'TOKEN')
    const fraction = super.multipliedBy(other)
    return new Price({
      baseCurrency: this.baseCurrency,
      quoteCurrency: other.quoteCurrency,
      numerator: fraction.numerator,
      denominator: fraction.denominator,
    })
  }

  public invert(): Price {
    return new Price({
      baseCurrency: this.quoteCurrency,
      quoteCurrency: this.baseCurrency,
      numerator: this.denominator,
      denominator: this.numerator,
    })
  }

  public toFraction(): Fraction {
    return this.clone()
  }
}
