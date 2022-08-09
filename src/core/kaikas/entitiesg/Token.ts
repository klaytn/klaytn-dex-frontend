import { parseAddress } from '../utils'
import Currency from './Currency'

export default class Token extends Currency {
  public readonly address: string
  public readonly projectLink?: string

  public constructor({
    address,
    decimals,
    symbol,
    name,
    projectLink,
  }: {
    address: string
    decimals: number
    symbol?: string
    name?: string
    projectLink?: string
  }) {
    super(decimals, symbol, name)
    this.address = parseAddress(address)
    this.projectLink = projectLink
  }

  public equals(other: Token): boolean {
    if (this === other) {
      return true
    }
    return this.address === other.address
  }
}

export function currencyEquals(currencyA: Currency, currencyB: Currency): boolean {
  if (currencyA instanceof Token && currencyB instanceof Token) {
    return currencyA.equals(currencyB)
  } else if (currencyA instanceof Token) {
    return false
  } else if (currencyB instanceof Token) {
    return false
  } else {
    return currencyA === currencyB
  }
}
