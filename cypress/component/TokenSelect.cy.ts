import TokenSelectModal from '@/components/TokenSelectModal.vue'
import { Address, Wei } from '@/core'
import { WHITELIST_TOKENS } from '@/core/const'
import { MaybeRef } from '@vueuse/core'
import { TOASTS_API_KEY, defineToastsApi } from '@soramitsu-ui/ui'
import { apiKey as minimalTokensApiKey } from '@/utils/minimal-tokens-api'

const testid = (id: string) => `[data-testid=${id}]`
const TESTID_RECENT_TOKEN = testid('modal-recent-token')
const TESTID_LIST_ITEM = testid('modal-list-item')
const TESTID_SEARCH = testid('modal-search')

describe('Token select modal', () => {
  function mountFactory(props?: { selected?: MaybeRef<Set<Address>> }) {
    cy.mount(
      {
        components: { TokenSelectModal },
        setup() {
          const tokens = WHITELIST_TOKENS

          provide(TOASTS_API_KEY, defineToastsApi())
          provide(minimalTokensApiKey, {
            lookupBalance: (a) =>
              new Wei(BigInt(tokens.findIndex((x) => x.address === a)) * 1_876_000_141_785_000_000n),
            lookupDerivedUsd: () => null,
            getToken: () => {
              throw new Error('unimpl')
            },
            lookupToken: (a) => {
              const regex = new RegExp('^' + a + '$', 'i')
              return tokens.find((x) => regex.test(x.address)) ?? null
            },
            isSmartContract: async () => true,
          })

          return {
            tokens,
            selected: props?.selected ?? null,
          }
        },
        template: `
          <TokenSelectModal
            show
            :selected="selected"
            :tokens="tokens"
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

    cy.get(TESTID_LIST_ITEM).contains(token.symbol).should('have.css', 'pointer-events', 'none')
    cy.get(TESTID_RECENT_TOKEN).contains(token.symbol).should('have.css', 'pointer-events', 'none')
  })

  it('selected token with lowercase addr is disabled too', () => {
    const token = WHITELIST_TOKENS.at(4)!

    mountFactory({ selected: new Set([token.address.toLowerCase() as Address]) })

    cy.get(TESTID_LIST_ITEM).contains(token.symbol).should('have.css', 'pointer-events', 'none')
    cy.get(TESTID_RECENT_TOKEN).contains(token.symbol).should('have.css', 'pointer-events', 'none')
  })

  it('multiple selected tokens are disabled', () => {
    const tokens = [WHITELIST_TOKENS.at(2)!, WHITELIST_TOKENS.at(5)!]

    mountFactory({ selected: new Set(tokens.map((x) => x.address)) })

    for (const token of tokens) {
      cy.get(TESTID_LIST_ITEM).contains(token.symbol).should('have.css', 'pointer-events', 'none')
      cy.get(TESTID_RECENT_TOKEN).contains(token.symbol).should('have.css', 'pointer-events', 'none')
    }
  })

  it('search does not apply to "popular" tokens', () => {
    mountFactory()

    cy.get(TESTID_SEARCH).type('i do not exist')
    for (const token of WHITELIST_TOKENS.slice(0, 6)) {
      cy.get(TESTID_RECENT_TOKEN).contains(token.symbol).should('exist')
    }
  })

  it('search works with token name, symbol & address', () => {
    mountFactory()

    cy.get(TESTID_SEARCH).type('saturn')
    cy.get(TESTID_LIST_ITEM).contains('SAT').should('exist')

    cy.get(TESTID_SEARCH).clear().type('JUP')
    cy.get(TESTID_LIST_ITEM).contains('Jupiter').should('exist')

    cy.get(TESTID_SEARCH).clear().type('0x246C989333Fa3C3247C7171F6bca68062172992C'.toLowerCase())
    cy.get(TESTID_LIST_ITEM).contains('IO').should('exist')
  })
})
