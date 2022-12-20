import BigNumber from 'bignumber.js'
import { Except } from 'type-fest'
import { BigNumberIsh, CurrencySymbol, Token } from '../types'
import { parseBigNumberIsh } from '../utils'
import Fraction from './Fraction'

export default class Currency implements Except<Token, 'address'> {
  public readonly decimals: number
  public readonly symbol: CurrencySymbol
  public readonly name: string

  public constructor(decimals: number, symbol: CurrencySymbol, name: string) {
    this.decimals = decimals
    this.symbol = symbol
    this.name = name
  }

  public equals(other: Currency) {
    return other.symbol === this.symbol
  }

  public amountToFraction(amount: BigNumberIsh, raw = false): Fraction {
    const parsedAmount = parseBigNumberIsh(amount)
    const denominator = new BigNumber(10).pow(this.decimals)
    return new Fraction(raw ? parsedAmount.multipliedBy(denominator) : parsedAmount, denominator)
  }
}
