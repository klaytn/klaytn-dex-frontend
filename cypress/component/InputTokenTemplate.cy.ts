import InputTokenTemplate from '@/components/common/InputTokenTemplate.vue'

describe('InputTokenTemplate', () => {
  it('Typing 50.5', () => {
    cy.mount({
      components: { InputTokenTemplate },
      setup() {
        return {
          model: ref(''),
        }
      },
      template: `
        <InputTokenTemplate v-model="model" />
        <span>Value: {{ model }}</span>
      `,
    })

    cy.get('input').type('50.5')
    cy.contains('Value: 50.5')
  })

  it('Typing non-numeric characters - they are filtered out', () => {
    cy.mount({
      components: { InputTokenTemplate },
      setup() {
        return {
          model: ref(''),
        }
      },
      template: `
        <InputTokenTemplate v-model="model" />
        <span>Value: {{ model || '<none>' }}</span>
      `,
    })

    cy.get('input').type('aaa')
    cy.contains('Value: <none>')

    cy.get('input').clear().type('43')
    cy.contains('Value: 43')

    cy.get('input').type('...').should('have.value', '43...')
    cy.contains('Value: 43')

    cy.get('input').clear().type('12.414')
    cy.contains('Value: 12.414')

    cy.get('input').type('fas')
    cy.contains('Value: 12.414')
  })
})
