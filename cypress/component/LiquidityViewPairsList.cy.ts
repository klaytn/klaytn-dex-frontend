import PairsList from '@/modules/ModuleLiquidity/View/PairsList.vue'
import { createTestingPinia } from '@pinia/testing'
import { routerKey, routeLocationKey } from 'vue-router'
import { install as installNotifications } from '@/plugins/notifications'
import { LiquidityPairsPosition } from '@/modules/ModuleLiquidity/query.liquidity-pairs'

const TESTID_LIST_ITEM = '[data-testid=pair-list-item]'

function mountFactory(positions: LiquidityPairsPosition[]) {
  cy.mount(PairsList, {
    props: { positions },
    global: {
      plugins: [
        createTestingPinia({ createSpy: () => cy.spy() }),
        { install: (app: any) => installNotifications({ app } as any) },
      ],
      provide: {
        [routerKey as symbol]: {},
        [routeLocationKey as symbol]: {},
      },
    },
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
})
