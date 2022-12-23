import invariant from 'tiny-invariant'
import { Opaque } from 'type-fest'
import { Fraction, Percent, Wei } from './entities'

const ZERO = new Fraction(0)
const ONE = new Fraction(1)

/**
 * A non-negative percent value
 */
export type SlippagePercent = Opaque<Percent, 'slippage'>

export function parseSlippage(raw: Percent): SlippagePercent {
  invariant(!raw.isLessThan(ZERO), () => `Slippage should be a non-negative number, got: ${raw.toFixed()}`)
  return raw as SlippagePercent
}

export function adjustDown(amount: Wei, slippage: SlippagePercent): Wei {
  const adjusted = ONE.minus(slippage).multipliedBy(new Fraction(amount.asBigInt)).quotient.decimalPlaces(0)
  return new Wei(adjusted)
}

export function adjustUp(amount: Wei, slippage: SlippagePercent): Wei {
  const adjusted = ONE.plus(slippage).multipliedBy(new Fraction(amount.asBigInt)).quotient.decimalPlaces(0)
  return new Wei(adjusted)
}
