import TokenSelectModal from '@/components/TokenSelect/Modal.vue'
import { Address, Token, Wei } from '@/core/kaikas'
import { WHITELIST_TOKENS } from '@/core/kaikas/const'
import { TokenWithOptionBalance } from '@/store/tokens'
import { MaybeRef } from '@vueuse/core'

const testid = (id: string) => `[data-testid=${id}]`

describe('Token select modal', () => {
  function mountFactory(props?: { selected?: MaybeRef<Set<Address>> }) {
    cy.mount(
      {
        components: { TokenSelectModal },
        setup() {
          const tokens: TokenWithOptionBalance[] = WHITELIST_TOKENS.map((x, i) => ({
            ...x,
            balance: new Wei(BigInt(i) * 1_876_000_141_785_000_000n),
          }))

          function lookupToken(addr: Address) {
            const regex = new RegExp('^' + addr + '$', 'i')
            return tokens.find((x) => regex.test(x.address))
          }

          function isSmartContract() {
            return true
          }

          function getToken(addr: Address): Promise<Token> {
            throw new Error('unimpl')
          }

          return {
            tokens,
            getToken,
            lookupToken,
            isSmartContract,
            selected: props?.selected ?? null,
          }
        },
        template: `
          <TokenSelectModal
            open
            :selected="selected"
            :tokens="tokens"
            v-bind="{ getToken, lookupToken, isSmartContract }"
          />
        `,
      },
      {
        global: {
          stubs: { transition: false },
        },
      },
    )
  }

  it('renders the list of tokens', () => {
    mountFactory()
  })

  it('selected token is disabled', () => {
    const token = WHITELIST_TOKENS.at(4)!

    mountFactory({ selected: new Set([token.address]) })

    cy.get(testid('modal-list-item')).contains(token.symbol).should('have.css', 'pointer-events', 'none')
    cy.get(testid('modal-recent-token')).contains(token.symbol).should('have.css', 'pointer-events', 'none')
  })

  it('multiple selected tokens are disabled', () => {
    const tokens = [WHITELIST_TOKENS.at(2)!, WHITELIST_TOKENS.at(5)!]

    mountFactory({ selected: new Set(tokens.map((x) => x.address)) })

    for (const token of tokens) {
      cy.get(testid('modal-list-item')).contains(token.symbol).should('have.css', 'pointer-events', 'none')
      cy.get(testid('modal-recent-token')).contains(token.symbol).should('have.css', 'pointer-events', 'none')
    }
  })
})
