import invariant from 'tiny-invariant'
import BigNumber from 'bignumber.js'

import { BigNumberIsh } from '../types'
import { parseBigNumberIsh } from '../utils'
import Fraction from './Fraction'
import Currency from './Currency'

export default class CurrencyAmount extends Fraction {
  public readonly currency: Currency

  protected constructor(currency: Currency, amount: BigNumberIsh) {
    const parsedAmount = parseBigNumberIsh(amount)

    super(parsedAmount, new BigNumber(10).pow(currency.decimals))
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

  public toFixed(
    decimals: number = this.currency.decimals,
    rounding: BigNumber.RoundingMode = BigNumber.ROUND_DOWN,
    format?: object,
  ): string {
    invariant(decimals <= this.currency.decimals, 'DECIMALS')
    return super.toFixed(decimals, rounding, format)
  }
}
