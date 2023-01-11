import { describe, expect, test } from 'vitest'
import { CurrencySymbol } from '../types'
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
      symbol: 'MER' as CurrencySymbol,
      name: 'Mercury',
    })
    const TokenB = new TokenImpl({
      address: parseAddress('0x1CDcD477994e86A11E21C27ca907bEA266EA3A0a'),
      decimals: 18,
      symbol: 'VEN' as CurrencySymbol,
      name: 'Venus',
    })

    const trade = Trade.bestTrade({
      tradeType: 'exact-in',
      pairs: [
        new Pair({
          token0: TokenAmount.fromToken(TokenA, '100000000' as WeiAsToken),
          token1: TokenAmount.fromToken(TokenB, '100000000' as WeiAsToken),
          liquidityToken: new TokenImpl({
            address: parseAddress('0x1CDcD477994e86A11E21C27ca907bEA266EA3A0a'),
            decimals: 18,
            symbol: 'VEN-MER' as CurrencySymbol,
            name: '?',
          }),
        }),
      ],
      amountIn: TokenAmount.fromToken(TokenA, '50' as WeiAsToken),
      tokenOut: TokenB,
    })

    expect(trade.kind).toBe('ok')
    if (trade.kind === 'ok') {
      expect(trade.trade.route.toString()).toMatchInlineSnapshot('"MER > VEN"')
      expect(trade.trade.priceImpact.toFormat()).toMatchInlineSnapshot('"0.30%"')
    }
  })
})
