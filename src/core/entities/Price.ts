import BigNumber from 'bignumber.js'
import invariant from 'tiny-invariant'
import { BigNumberIsh } from '../types'
import Currency from './Currency'
import Route from './Route'
import Fraction from './Fraction'

export default class Price extends Fraction {
  public static fromRoute(route: Route): Price {
    const prices: Price[] = []
    for (const [i, pair] of route.pairs.entries()) {
      prices.push(
        route.path[i].equals(pair.token0)
          ? new Price({
              baseCurrency: pair.reserve0.currency,
              quoteCurrency: pair.reserve1.currency,
              numerator: pair.reserve1.raw,
              denominator: pair.reserve0.raw,
            })
          : new Price({
              baseCurrency: pair.reserve1.currency,
              quoteCurrency: pair.reserve0.currency,
              numerator: pair.reserve0.raw,
              denominator: pair.reserve1.raw,
            }),
      )
    }

    return prices.slice(1).reduce((accumulator, currentValue) => accumulator.multipliedBy(currentValue), prices[0])
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

  public toFixed(decimals: number, rounding: BigNumber.RoundingMode): string {
    return super.toFixed(decimals, rounding)
  }

  public toFormat(decimals = 2, rounding?: BigNumber.RoundingMode, format?: object): string {
    return super.toFormat(decimals, rounding, format)
  }

  public toFraction(): Fraction {
    return this.clone()
  }
}
