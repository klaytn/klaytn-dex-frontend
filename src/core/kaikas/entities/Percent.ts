import BigNumber from 'bignumber.js'
import Fraction from './Fraction'
import { ONE_HUNDRED_PERCENT } from '../const'

export default class Percent extends Fraction {
  public toFixed(decimals = 2, rounding: BigNumber.RoundingMode = BigNumber.ROUND_HALF_UP): string {
    return this.multipliedBy(ONE_HUNDRED_PERCENT).toFixed(decimals, rounding)
  }

  public toFormat(
    decimals = 2,
    rounding: BigNumber.RoundingMode = BigNumber.ROUND_HALF_UP,
    format: object = { decimalSeparator: '.', suffix: ' %' },
  ): string {
    return this.multipliedBy(ONE_HUNDRED_PERCENT).toFormat(decimals, rounding, format)
  }
}
