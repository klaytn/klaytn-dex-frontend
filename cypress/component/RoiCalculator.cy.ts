import RoiCalculator from '@/modules/ModuleEarnShared/RoiCalculator/index.vue'
import BigNumber from 'bignumber.js'
import { VueTestUtils } from 'cypress/vue'
import { createI18n } from 'vue-i18n'

const testid = (id: string) => `[data-testid=${id}]`
const getInput = () => cy.get('input' + testid('staked-input'))
const getReceive = () => cy.get('input' + testid('receive-value'))

function mountFactory() {
  return cy.mount({
    setup() {
      return {
        attrs: {
          apr: new BigNumber('9.851711488040969147'),
          lpApr: new BigNumber(0),
          type: 'farming',
          staked: new BigNumber(10),
          balance: new BigNumber('1754.807954103219468827'),
          stakeTokenPrice: new BigNumber(200),
          stakeTokenDecimals: 18,
          rewardTokenDecimals: 18,
          stakeTokenSymbol: 'VEN-ARS',
          rewardTokenSymbol: 'DEX',
        },
      }
    },
    template: `
      <RoiCalc
        show
        v-bind="attrs"
      />
    `,
  })
}

before(() => {
  VueTestUtils.config.global.components = { RoiCalc: RoiCalculator }
  VueTestUtils.config.global.stubs = { transition: false }
  VueTestUtils.config.global.plugins = [
    createI18n({
      legacy: false,
      fallbackWarn: false,
      missingWarn: false,
      locale: 'en',
      messages: {
        en: {
          ModuleEarnSharedRoiCalculator: {
            title: 'My title!',
          },
        },
      },
    }),
  ]
})

after(() => {
  VueTestUtils.config.global.components = {}
  VueTestUtils.config.global.stubs = {}
  VueTestUtils.config.global.plugins = []
})

describe('RoiCalculator', () => {
  it('playground', () => {
    mountFactory()
  })

  it('typing value', () => {
    mountFactory()

    getInput().type('123').should('have.value', '$10,123')
    getReceive().should('have.value', '$1,047.92')
  })

  it('assert "switch unit" behaviour')
  it('assert value setting by clicking on preset amounts')
  it('assert behaviour on clicking on staked for, compounding every (off/on)')
  it('assert "Details" section has correct data')
  it('assert calcucations are done correct with different props (apr, decimals etc)')
})
