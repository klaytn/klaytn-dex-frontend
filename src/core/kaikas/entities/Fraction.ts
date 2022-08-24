import invariant from 'tiny-invariant'
import BigNumber from 'bignumber.js'
import { BigNumberIsh } from '../types'
import { ONE } from '../const'
import { parseBigNumberIsh } from '../utils'

export default class Fraction {
  public readonly numerator: BigNumber
  public readonly denominator: BigNumber

  public constructor(numerator: BigNumberIsh, denominator: BigNumberIsh = ONE) {
    this.numerator = parseBigNumberIsh(numerator)
    this.denominator = parseBigNumberIsh(denominator)
  }

  public get quotient(): BigNumber {
    return this.numerator.dividedBy(this.denominator)
  }

  public invert(): Fraction {
    return new Fraction(this.denominator, this.numerator)
  }

  public plus(other: Fraction | BigNumberIsh): Fraction {
    const otherParsed = other instanceof Fraction ? other : new Fraction(parseBigNumberIsh(other))
    if (this.denominator.isEqualTo(otherParsed.denominator)) {
      return new Fraction(this.numerator.plus(otherParsed.numerator), this.denominator)
    }
    return new Fraction(
      this.numerator.times(otherParsed.denominator).plus(otherParsed.numerator.times(this.denominator)),
      this.denominator.times(otherParsed.denominator),
    )
  }

  public minus(other: Fraction | BigNumberIsh): Fraction {
    const otherParsed = other instanceof Fraction ? other : new Fraction(parseBigNumberIsh(other))
    if (this.denominator.isEqualTo(otherParsed.denominator)) {
      return new Fraction(this.numerator.minus(otherParsed.numerator), this.denominator)
    }
    return new Fraction(
      this.numerator.times(otherParsed.denominator).minus(otherParsed.numerator.times(this.denominator)),
      this.denominator.times(otherParsed.denominator),
    )
  }

  public isLessThan(other: Fraction | BigNumberIsh): boolean {
    const otherParsed = other instanceof Fraction ? other : new Fraction(parseBigNumberIsh(other))
    const compareValue = this.numerator.times(otherParsed.denominator)
    const compareWith = otherParsed.numerator.times(this.denominator)
    return compareValue.isLessThan(compareWith)
  }

  public isEqualTo(other: Fraction | BigNumberIsh): boolean {
    const otherParsed = other instanceof Fraction ? other : new Fraction(parseBigNumberIsh(other))
    const compareValue = this.numerator.times(otherParsed.denominator)
    const compareWith = otherParsed.numerator.times(this.denominator)
    return compareValue.isEqualTo(compareWith)
  }

  public isGreaterThan(other: Fraction | BigNumberIsh): boolean {
    const otherParsed = other instanceof Fraction ? other : new Fraction(parseBigNumberIsh(other))
    const compareValue = this.numerator.times(otherParsed.denominator)
    const compareWith = otherParsed.numerator.times(this.denominator)
    return compareValue.isGreaterThan(compareWith)
  }

  public multipliedBy(other: Fraction | BigNumberIsh): Fraction {
    const otherParsed = other instanceof Fraction ? other : new Fraction(parseBigNumberIsh(other))
    return new Fraction(this.numerator.times(otherParsed.numerator), this.denominator.times(otherParsed.denominator))
  }

  public dividedBy(other: Fraction | BigNumberIsh): Fraction {
    const otherParsed = other instanceof Fraction ? other : new Fraction(parseBigNumberIsh(other))
    return new Fraction(this.numerator.times(otherParsed.denominator), this.denominator.times(otherParsed.numerator))
  }

  public toFixed(decimals = 2, rounding: BigNumber.RoundingMode = BigNumber.ROUND_HALF_UP): string {
    invariant(decimals >= 0, `${decimals} is negative.`)
    return this.numerator.div(this.denominator).toFixed(decimals, rounding)
  }

  public toFormat(
    decimals = 2,
    rounding: BigNumber.RoundingMode = BigNumber.ROUND_HALF_UP,
    format: object = { decimalSeparator: '.' },
  ): string {
    invariant(decimals >= 0, `${decimals} is negative.`)
    return this.numerator.div(this.denominator).toFormat(decimals, rounding, format)
  }

  public get asFraction(): Fraction {
    return new Fraction(this.numerator, this.denominator)
  }
}
