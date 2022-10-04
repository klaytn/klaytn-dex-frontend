import invariant from 'tiny-invariant'
import BigNumber from 'bignumber.js'
import { BigNumberIsh } from '../types'
import { parseBigIntIsh, parseBigNumberIsh } from '../utils'

export default class Fraction {
  public static fromBigNumber(value: BigNumberIsh, decimals = 0) {
    const denominator = new BigNumber(10).pow(decimals)
    const numerator = parseBigNumberIsh(value).multipliedBy(denominator)
    return new Fraction(numerator.toFixed(0), denominator)
  }

  public readonly numerator: bigint
  public readonly denominator: bigint

  public constructor(numerator: BigNumberIsh, denominator: BigNumberIsh = 1) {
    this.numerator = parseBigIntIsh(numerator)
    this.denominator = parseBigIntIsh(denominator)
  }

  public get quotient(): BigNumber {
    return new BigNumber(this.numerator.toString()).dividedBy(this.denominator.toString())
  }

  public invert(): Fraction {
    return new Fraction(this.denominator, this.numerator)
  }

  public plus(other: Fraction): Fraction {
    if (this.denominator === other.denominator) {
      return new Fraction(this.numerator + other.numerator, this.denominator)
    }
    return new Fraction(
      this.numerator * other.denominator + other.numerator * this.denominator,
      this.denominator * other.denominator,
    )
  }

  public minus(other: Fraction): Fraction {
    if (this.denominator === other.denominator) {
      return new Fraction(this.numerator - other.numerator, this.denominator)
    }
    return new Fraction(
      this.numerator * other.denominator - other.numerator * this.denominator,
      this.denominator * other.denominator,
    )
  }

  public isLessThan(other: Fraction): boolean {
    return this.numerator * other.denominator < other.numerator * this.denominator
  }

  public isLessOrEqualThan(other: Fraction): boolean {
    return this.numerator * other.denominator <= other.numerator * this.denominator
  }

  public isEqualTo(other: Fraction): boolean {
    return this.numerator * other.denominator === other.numerator * this.denominator
  }

  public isGreaterThan(other: Fraction): boolean {
    return this.numerator * other.denominator > other.numerator * this.denominator
  }

  public isGreaterOrEqualThan(other: Fraction): boolean {
    return this.numerator * other.denominator >= other.numerator * this.denominator
  }

  public multipliedBy(other: Fraction): Fraction {
    return new Fraction(this.numerator * other.numerator, this.denominator * other.denominator)
  }

  public dividedBy(other: Fraction): Fraction {
    return new Fraction(this.numerator * other.denominator, this.denominator * other.numerator)
  }

  public toFixed(decimals = 2, rounding: BigNumber.RoundingMode = BigNumber.ROUND_HALF_UP): string {
    invariant(decimals >= 0, `${decimals} is negative.`)
    return parseBigNumberIsh(this.numerator).div(parseBigNumberIsh(this.denominator)).toFixed(decimals, rounding)
  }

  public toFormat(
    decimals = 2,
    rounding: BigNumber.RoundingMode = BigNumber.ROUND_HALF_UP,
    format: object = { decimalSeparator: '.' },
  ): string {
    invariant(decimals >= 0, `${decimals} is negative.`)
    return parseBigNumberIsh(this.numerator)
      .div(parseBigNumberIsh(this.denominator))
      .toFormat(decimals, rounding, format)
  }

  public clone(): Fraction {
    return new Fraction(this.numerator, this.denominator)
  }
}
