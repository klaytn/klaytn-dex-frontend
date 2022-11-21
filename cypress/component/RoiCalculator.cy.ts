import RoiCalculator from '@/modules/ModuleEarnShared/RoiCalculator/index.vue'
import BigNumber from 'bignumber.js'
import { VueTestUtils } from 'cypress/vue'
import { createI18n } from 'vue-i18n'
import { testid } from './common'

const getInput = () => cy.get('input' + testid('input-staked'))
const getInputAltUnits = () => cy.get(testid('input-staked-alt-units'))
const getSwitchBtn = () => cy.get(testid('switch-units'))
const getReceive = () => cy.get('input' + testid('receive-value'))
const getReceiveAltUnits = () => cy.get(testid('receive-value-alt-units'))

function mountFactory(props?: { stakeTokenPrice?: BigNumber }) {
  return cy.mount({
    setup() {
      return {
        attrs: {
          apr: new BigNumber('9.851711488040969147'),
          lpApr: new BigNumber(0),
          type: 'farming',
          staked: new BigNumber('10'),
          balance: new BigNumber('1754.807954103219468827'),
          stakeTokenPrice: props?.stakeTokenPrice ?? new BigNumber(200),
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

beforeEach(() => {
  cy.viewport(550, 800)
})

describe('RoiCalculator', () => {
  it('playground', () => {
    mountFactory()
  })

  it('typing value', () => {
    mountFactory()

    getInput().type('123').blur().should('have.value', '$10,123')
    getReceive().should('have.value', '$1,047.919')
  })

  it('when "$10" is clicked, then value is set in dollars', () => {
    mountFactory()

    cy.contains('$10').click()
    getInput().should('have.value', '$10')
  })

  it('when units are switched, values are updated accordingly', () => {
    mountFactory()

    getInput().should('have.value', '$10')
    getInputAltUnits().should('have.text', '0.05 VEN-ARS')
    getReceive().should('have.value', '$1.035')

    getSwitchBtn().click()

    getInput().should('have.value', '0.05 VEN-ARS')
    getInputAltUnits().should('have.text', '$10')
    getReceive().should('have.value', '0.005175931096196333 DEX')
  })

  it('Amounts precision is preserved on switch', () => {
    mountFactory({ stakeTokenPrice: new BigNumber('6.21392439956') })

    const USD = '$10'
    const USD_RECEIVE = '$1.035'
    const TOKEN = '1.609288970543009366 VEN-ARS'
    const TOKEN_RECEIVE = '0.166591376507986927 DEX'

    const assertValues = (init = true) => {
      getInput().should('have.value', init ? USD : TOKEN)
      getInputAltUnits().should('have.text', init ? TOKEN : USD)

      getReceive().should('have.value', init ? USD_RECEIVE : TOKEN_RECEIVE)
      getReceiveAltUnits().should('have.text', init ? TOKEN_RECEIVE : USD_RECEIVE)
    }

    assertValues()
    getSwitchBtn().click()
    assertValues(false)
    getSwitchBtn().click()
    assertValues()
  })

  it('assert value setting by clicking on preset amounts')
  it('assert behaviour on clicking on staked for, compounding every (off/on)')
  it('assert "Details" section has correct data')
  it('assert calcucations are done correct with different props (apr, decimals etc)')
})
