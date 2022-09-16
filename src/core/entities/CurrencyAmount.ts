import { BigNumberIsh } from '../types'
import Fraction from './Fraction'
import Currency from './Currency'

export default class CurrencyAmount<T extends Currency> extends Fraction {
  public static fromAmount<T extends Currency>(currency: T, amount: BigNumberIsh, raw = false): CurrencyAmount<T> {
    const { denominator, numerator } = currency.amountToFraction(amount, raw)
    return new CurrencyAmount(currency, denominator, numerator)
  }

  public readonly currency: T

  protected constructor(currency: T, numenator: BigNumberIsh, denominator: BigNumberIsh) {
    super(numenator, denominator)
    this.currency = currency
  }
}
