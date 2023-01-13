import CardImportToken from '@/components/common/ModalCardConfirmImportToken.vue'
import { Address, CurrencySymbol, Token, Wei } from '@/core'
import { MODAL_API_KEY, ModalApi } from '@soramitsu-ui/ui'
import BigNumber from 'bignumber.js'

function mountFactory(props?: { balance?: Wei; derivedUsd?: BigNumber }) {
  const token: Token = {
    address: '0x7cB550723972d7F29b047D6e71b62DcCcAF93992' as Address,
    name: 'Neptune',
    symbol: 'NEP' as CurrencySymbol,
    decimals: 18,
  }

  const modalApi: ModalApi = {
    close: () => {},
    focusTrap: null,
    labelledBy: 'label',
    describedBy: null,
  }

  return cy.mount(
    {
      components: { CardImportToken },
      setup() {
        return {
          token,
          balance: props?.balance,
          derivedUsd: props?.derivedUsd,
        }
      },
      template: `
        <div class="p-4 flex items-center justify-center">
          <div class="shadow-lg">
            <CardImportToken
              :token="token"
              :balance="balance"
              :derived-usd="derivedUsd"
            />
          </div>
        </div>
      `,
    },
    {
      global: {
        provide: {
          [MODAL_API_KEY as symbol]: modalApi,
        },
      },
    },
  )
}

describe('Confirm import token', () => {
  it('playground', () => {
    mountFactory({ balance: new Wei(411121999821n * 10n ** 10n), derivedUsd: new BigNumber('5.12') })
  })

  it('when "I understand" is not checked, confirmation button is disabled', () => {
    mountFactory()

    cy.contains('Import asset').closest('button').should('be.disabled')
    cy.contains('I understand').click()
    cy.contains('Import asset').closest('button').should('be.enabled')
  })
})
