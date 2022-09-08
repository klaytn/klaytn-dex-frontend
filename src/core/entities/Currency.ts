import BigNumber from 'bignumber.js'
import { Except } from 'type-fest'
import { BigNumberIsh, Token, TokenSymbol } from '../types'
import { parseBigNumberIsh } from '../utils'
import Fraction from './Fraction'

export default class Currency implements Except<Token, 'address'> {
  public readonly decimals: number
  public readonly symbol: TokenSymbol
  public readonly name: string

  protected constructor(decimals: number, symbol: TokenSymbol, name: string) {
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
