import KlayToast from '@/components/common/KlayToast.vue'
import { VueTestUtils } from 'cypress/vue'
import { testid } from './common'

before(() => {
  VueTestUtils.config.global.components = { KlayToast }
})

after(() => {
  VueTestUtils.config.global.components = {}
})

describe('KlayToast', () => {
  it('playground', () => {
    cy.mount({
      setup() {
        const { inc, count } = useCounter()

        return {
          someError: new Error('umm'),
          count,
          inc,
        }
      },
      template: `
        <div class="p-4 grid grid-cols-2 gap-4">
          <KlayToast
            type="ok"
            title="Everything is fine"
            data-testid="custom-ok"
          />

          <KlayToast
            type="err"
            title="Ohh, very bad..."
            data-testid="custom-err"
          />

          <KlayToast
            type="err"
            data-testid="default-err"
          />

          <KlayToast
            type="ok"
            data-testid="default-ok"
          />

          <KlayToast
            type="ok"
            description="Task succeeded"
            data-testid="ok-description"
          />

          <KlayToast
            type="err"
            data-testid="err-description"
            :error="someError"
          >
            <template #description>
              Something went wrong
            </template>
          </KlayToast>

          <KlayToast
            type="ok"
            title="Everything is fine"
            action="Click me"
            data-testid="with-action"
            @click:action="inc"
          >
            <template #description>
              Count: {{ count }}
            </template>
          </KlayToast>
        </div>
      `,
    })

    cy.get(testid('custom-ok')).contains('Everything is fine')
    cy.get(testid('custom-err')).contains('Ohh, very bad...')
    cy.get(testid('default-err')).contains('Error')
    cy.get(testid('default-ok')).contains('Success')
    cy.get(testid('ok-description')).contains('Task succeeded')

    cy.get(testid('with-action')).within(() => {
      cy.get('button').contains('Click me').click()
      cy.contains('Count: 1')
    })
  })

  it('when type=err and error is provided, it is displayed', () => {
    cy.mount({
      setup() {
        return {
          error: new SyntaxError('My sugar is not accepted'),
        }
      },
      template: `
        <KlayToast type="err" v-bind="{ error }" />
      `,
    })

    cy.contains('SyntaxError: My sugar is not accepted')
  })

  it('it is closed on click', () => {
    cy.mount({
      setup() {
        return {
          closed: ref(false),
        }
      },
      template: `
        <KlayToast type="ok" @click:close="closed = true" />
        {{ closed ? 'Closed' : 'Still opened' }}
      `,
    })

    cy.get(testid('btn-close')).click()
    cy.contains('Closed')
  })
})
