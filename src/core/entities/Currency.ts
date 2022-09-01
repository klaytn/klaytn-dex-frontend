import { Except } from 'type-fest'
import { Token, TokenSymbol } from '../types'

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
}
