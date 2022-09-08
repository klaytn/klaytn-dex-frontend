import { Trade, Pair } from '@uniswap/v2-sdk'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { test, expect } from 'vitest'

test('sandbox', () => {
  const TokenA = new Token(1, '0xb9920BD871e39C6EF46169c32e7AC4C698688881', 18, 'MER', 'Mercury')
  const TokenB = new Token(1, '0x1CDcD477994e86A11E21C27ca907bEA266EA3A0a', 18, 'VEN', 'Venus')

  const trade = Trade.bestTradeExactOut(
    [new Pair(CurrencyAmount.fromRawAmount(TokenA, 10), CurrencyAmount.fromRawAmount(TokenB, 20))],
    TokenB,
    CurrencyAmount.fromRawAmount(TokenA, 52),
  )

  expect(trade).toHaveLength(1)
  expect(trade[0].route.path.map((x) => x.symbol!).join(' > ')).toMatchInlineSnapshot('"MER > VEN"')
})
