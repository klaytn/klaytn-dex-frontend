import { Address, TokenSymbol } from '../types'
import { parseAddress } from '../utils'
import Currency from './Currency'

export default class TokenImpl extends Currency {
  public readonly address: Address
  public readonly projectLink?: string

  public constructor({
    address,
    decimals,
    symbol,
    name,
    projectLink,
  }: {
    address: Address
    decimals: number
    symbol?: TokenSymbol
    name?: string
    projectLink?: string
  }) {
    super(decimals, symbol, name)
    this.address = parseAddress(address)
    this.projectLink = projectLink
  }

  public equals(other: TokenImpl): boolean {
    if (this === other) {
      return true
    }
    return this.address === other.address
  }
}

export function currencyEquals(currencyA: Currency, currencyB: Currency): boolean {
  if (currencyA instanceof TokenImpl && currencyB instanceof TokenImpl) {
    return currencyA.equals(currencyB)
  } else if (currencyA instanceof TokenImpl) {
    return false
  } else if (currencyB instanceof TokenImpl) {
    return false
  } else {
    return currencyA === currencyB
  }
}
