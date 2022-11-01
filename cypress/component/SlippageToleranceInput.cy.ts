import SlippageToleranceInput from '@/components/common/SlippageToleranceInput.vue'
import { VueTestUtils } from 'cypress/vue'
import { testid } from './common'

before(() => {
  VueTestUtils.config.global.stubs.transition = false
})

after(() => {
  VueTestUtils.config.global.stubs.transition = true
})

function mountFactory(props?: { thresholdMayFail?: number; thresholdMayBeFrontrun?: number; initialValue?: number }) {
  return cy.mount({
    components: { SlippageToleranceInput },
    setup() {
      const model = ref(props?.initialValue ?? 0.05)
      const bindings = { ...props }

      return { model, bindings }
    },
    template: `
      <SlippageToleranceInput
        v-model="model"
        v-bind="bindings"
      />

      <span id="actual">Actual: {{ model }}</span>
    `,
  })
}

const actualShouldBe = (value: string) => cy.get('#actual').should('have.text', 'Actual: ' + value)
const getHeader = () => cy.contains('Slippage tolerance')
const getHeaderValue = () => cy.get(testid('header-value'))

describe('Slippage Tolerance Input', () => {
  it('playground', () => {
    mountFactory()
    getHeader().click()
  })

  it('initial header value is 5%', () => {
    mountFactory()

    getHeaderValue().should('have.text', '5%')
  })

  it('when the input expands, header value disappears', () => {
    mountFactory()
    getHeader().click()
    getHeaderValue().should('not.be.visible')
  })

  it('click on 3% sets 0.03 model', () => {
    mountFactory()

    getHeader().click()

    cy.get(testid('preset-btn')).contains('3%').click()
    actualShouldBe('0.03')
  })

  it('"may fail" warning is active when value is too low', () => {
    mountFactory({ thresholdMayFail: 0.1 })

    getHeader().click()
    cy.contains('Your transaction may fail')
  })

  it('"may be frontrun" warning is active when value is too hight', () => {
    mountFactory({ thresholdMayBeFrontrun: 0.01 })

    getHeader().click()
    cy.contains('Your transaction may be frontrun')
  })

  it('when info icon is hovered, the tooltip is shown')

  it('when too much decimals are typed, they are limited to 2', () => {
    mountFactory({ initialValue: 0 })

    getHeader().click()
    cy.get('input').type('0.111').should('have.value', '0.11')
  })

  it('input value is formatted as percent', () => {
    mountFactory({ initialValue: 0 })

    getHeader().click()

    cy.get('input').type('11.2').blur().should('have.value', '11.2%')
  })

  it('value from input is set precisely', () => {
    mountFactory({ initialValue: 0 })

    getHeader().click()

    cy.get('input').type('11.2')
    actualShouldBe('0.112')
  })
})
