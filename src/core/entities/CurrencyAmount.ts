import invariant from 'tiny-invariant'
import BigNumber from 'bignumber.js'

import { BigNumberIsh } from '../types'
import { parseBigNumberIsh } from '../utils'
import Fraction from './Fraction'
import Currency from './Currency'

export default class CurrencyAmount extends Fraction {
  public readonly currency: Currency

  /**
   * @param currency
   * @param amount
   * @param withDecimals if not, `amount` will be transformed with the `currency`'s decimals
   */
  protected constructor(currency: Currency, amount: BigNumberIsh, withDecimals = true) {
    const parsedAmount = parseBigNumberIsh(amount)
    const denominator = new BigNumber(10).pow(currency.decimals)
    super(withDecimals ? parsedAmount : parsedAmount.multipliedBy(denominator), denominator)
    this.currency = currency
  }

  public get raw(): bigint {
    return this.numerator
  }

  public plus(other: CurrencyAmount): CurrencyAmount {
    invariant(this.currency.equals(other.currency), 'TOKEN')
    return new CurrencyAmount(this.currency, this.raw + other.raw)
  }

  public minus(other: CurrencyAmount): CurrencyAmount {
    invariant(this.currency.equals(other.currency), 'TOKEN')
    return new CurrencyAmount(this.currency, this.raw + other.raw)
  }

  public toFixed(decimals = 18, rounding?: BigNumber.RoundingMode): string {
    invariant(decimals <= this.currency.decimals, 'DECIMALS')
    return super.toFixed(decimals, rounding)
  }

  public toFormat(decimals = 18, rounding?: BigNumber.RoundingMode, format?: object): string {
    invariant(decimals <= this.currency.decimals, 'DECIMALS')
    return super.toFormat(decimals, rounding, format)
  }
}
