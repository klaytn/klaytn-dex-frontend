import { Address, Token, TokenSymbol } from '../types'
import { parseAddress } from '../utils'
import Currency from './Currency'

export default class TokenImpl extends Currency implements Token {
  public readonly address: Address

  public constructor({ address, decimals, symbol, name }: Token) {
    super(decimals, symbol, name)
    this.address =
      // FIXME
      address.toLowerCase() as Address
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
