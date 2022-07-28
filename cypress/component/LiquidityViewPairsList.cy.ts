import PairsList from '@/modules/ModuleLiquidity/View/PairsList.vue'
import { createTestingPinia } from '@pinia/testing'

const TESTID_LIST_ITEM = '[data-testid=pair-list-item]'

describe('LiquidityViewPairsList.cy.ts', () => {
  it('it should not render position with 0 balance', () => {
    cy.fixture('liquidity-positions').then((positions) => {
      cy.mount(PairsList, {
        props: { positions },
        global: {
          plugins: [createTestingPinia({ createSpy: () => cy.spy() })],
        },
      })
    })

    cy.get(TESTID_LIST_ITEM).should('have.length', 2)
  })
})
