import invariant from 'tiny-invariant'
import { Address, CurrencySymbol, Token } from '../types'
import { parseAddress } from '../utils'
import Currency from './Currency'

import { UniToken } from './uni-entities'

export default class TokenImpl extends Currency implements Token {
  public static fromUni(uni: UniToken): TokenImpl {
    const { name, symbol, address, decimals } = uni
    invariant(name && symbol)
    return new TokenImpl({ name, symbol: symbol as CurrencySymbol, decimals, address: parseAddress(address) })
  }

  public readonly address: Address

  public constructor({ address, decimals, symbol, name }: Token) {
    super(decimals, symbol, name)
    this.address = address
  }

  public toUni(): UniToken {
    return new UniToken(-1, this.address, this.decimals, this.symbol, this.name)
  }
}
