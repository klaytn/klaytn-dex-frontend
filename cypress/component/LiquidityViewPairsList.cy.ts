/* eslint-disable max-nested-callbacks */
import PairsList from '@/modules/ModuleLiquidity/View/PairsList.vue'
import { LiquidityPairsPosition } from '@/modules/ModuleLiquidity/query.liquidity-pairs'
import { deepClone } from '@/utils/common'
import { WeiAsToken } from '@/core'
import { testid } from './common'

const TESTID_LIST_ITEM = testid('pair-list-item')
const TESTID_ITEM_HEADER_VALUE = testid('pair-list-item-header-value')
const TESTID_ITEM_HEADER_VALUE_USD = testid('pair-list-item-header-value-usd')

function mountFactory(positions: LiquidityPairsPosition[]) {
  cy.mount(PairsList, {
    props: { positions },
  })
}

describe('LiquidityViewPairsList.cy.ts', () => {
  it('it should not render position with 0 balance', () => {
    cy.fixture('liquidity-positions').then((positions) => {
      mountFactory(positions)
    })

    cy.get(TESTID_LIST_ITEM).should('have.length', 2)
  })

  it('"Your pool share" should be computed correctly', () => {
    cy.fixture('liquidity-positions-ven-ars').then((positions) => {
      mountFactory(positions)
    })

    cy.get(TESTID_LIST_ITEM).contains('Your pool share').next().contains('70%')
  })

  it('When position has empty reserved 0 or 1 value, it is not rendered', () => {
    cy.fixture('liquidity-positions').then(([first]: LiquidityPairsPosition[]) => {
      const empty0 = deepClone(first)
      empty0.pair.reserve0 = '0' as WeiAsToken

      const empty1 = deepClone(first)
      empty1.pair.reserve1 = '0' as WeiAsToken

      mountFactory([first, empty0, empty1])
    })

    cy.get(TESTID_LIST_ITEM).should('have.length', 1)
  })

  it("Values in the ListItem header are user's amounts, not full", () => {
    cy.fixture('liquidity-positions').then((positions) => {
      mountFactory(positions)
    })

    cy.get(TESTID_LIST_ITEM)
      .first()
      .within(() => {
        cy.get(TESTID_ITEM_HEADER_VALUE).should('have.text', '0.56515')
        cy.get(TESTID_ITEM_HEADER_VALUE_USD).should('have.text', '($0.842)')
      })
  })

  it('When totalSupply and reserveUsd are 0, then USD balance is not shown', () => {
    cy.fixture('liquidity-positions-zero-usd').then((positions) => {
      mountFactory(positions)
    })

    cy.get(TESTID_ITEM_HEADER_VALUE).should('exist')
    cy.get(TESTID_ITEM_HEADER_VALUE_USD).should('not.exist')
  })
})
