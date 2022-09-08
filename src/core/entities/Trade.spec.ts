import { test, expect, describe } from 'vitest'
import { TokenSymbol } from '../types'
import { parseAddress } from '../utils'
import Pair from './Pair'
import TokenAmount from './TokenAmount'
import TokenImpl from './TokenImpl'
import Trade from './Trade'
import { WeiAsToken } from './Wei'

describe('Trade', () => {
  test('exact in', () => {
    const TokenA = new TokenImpl({
      address: parseAddress('0xb9920BD871e39C6EF46169c32e7AC4C698688881'),
      decimals: 18,
      symbol: 'MER' as TokenSymbol,
      name: 'Mercury',
    })
    const TokenB = new TokenImpl({
      address: parseAddress('0x1CDcD477994e86A11E21C27ca907bEA266EA3A0a'),
      decimals: 18,
      symbol: 'VEN' as TokenSymbol,
      name: 'Venus',
    })

    const trade = Trade.bestTradeExactIn(
      [
        new Pair(
          TokenAmount.fromToken(TokenA, '100' as WeiAsToken),
          TokenAmount.fromToken(TokenB, '100' as WeiAsToken),
        ),
      ],
      TokenAmount.fromToken(TokenA, '50' as WeiAsToken),
      TokenB,
    )

    expect(trade).not.toBeNull()
    expect(trade!.route.toString()).toMatchInlineSnapshot('"MER > VEN"')
    expect(trade!.priceImpact.toFormat()).toMatchInlineSnapshot('"34.00 %"')
  })
})
