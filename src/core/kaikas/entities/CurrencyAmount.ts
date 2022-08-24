import invariant from 'tiny-invariant'
import BigNumber from 'bignumber.js'

import { BigNumberIsh } from '../types'
import { parseBigNumberIsh } from '../utils'
import Fraction from './Fraction'
import Currency from './Currency'

export default class CurrencyAmount extends Fraction {
  public readonly currency: Currency

  public constructor(currency: Currency, amount: BigNumberIsh, raw = false) {
    const parsedAmount = parseBigNumberIsh(amount)
    const denominator = new BigNumber(10).pow(currency.decimals)
    super(raw ? parsedAmount : parsedAmount.multipliedBy(denominator), denominator)
    this.currency = currency
  }

  public get raw(): BigNumber {
    return this.numerator
  }

  public plus(other: CurrencyAmount): CurrencyAmount {
    invariant(this.currency.isEqualTo(other.currency), 'TOKEN')
    return new CurrencyAmount(this.currency, this.raw.plus(other.raw))
  }

  public minus(other: CurrencyAmount): CurrencyAmount {
    invariant(this.currency.isEqualTo(other.currency), 'TOKEN')
    return new CurrencyAmount(this.currency, this.raw.minus(other.raw))
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
