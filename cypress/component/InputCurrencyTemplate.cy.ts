import InputCurrencyTemplate from '@/components/common/InputCurrencyTemplate.vue'
import { VueTestUtils } from 'cypress/vue'

before(() => {
  VueTestUtils.config.global.components = { InputCurrencyTemplate }
})

after(() => {
  VueTestUtils.config.global.components = {}
})

describe('InputCurrencyTemplate', () => {
  it('"right" slot is enabled by prop', () => {
    cy.mount({
      template: `
        <InputCurrencyTemplate right>
          <template #right>
            <span>Chu!</span>
          </template>
        </InputCurrencyTemplate>
      `,
    })

    cy.contains('Chu!')
  })
})
