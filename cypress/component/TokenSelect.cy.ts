import TokenSelectPure from '@/components/TokenSelectPure.vue'
import { Address, CurrencySymbol, Token, Wei } from '@/core'
import { TOKENS_LIST } from '../../test/util'
import { MaybeRef } from '@vueuse/core'
import { TOASTS_API_KEY, defineToastsApi } from '@soramitsu-ui/ui'
import { apiKey as minimalTokensApiKey } from '@/utils/minimal-tokens-api'
import { testid } from './common'
import { Ref } from 'vue'

describe('TokenSelectPure', () => {
  function mountFactory(props?: {
    selected?: MaybeRef<Set<Address>>
    model?: Ref<null | Address>
    areImportedTokensPending?: Ref<boolean>
    tokensImported?: Ref<null | Token[]>
    customGetToken?: (address: Address) => Promise<Token>
  }) {
    cy.viewport(550, 800)

    cy.mount(
      {
        components: { TokenSelectPure },
        setup() {
          const tokens = computed(() => [...(unref(props?.tokensImported) ?? []), ...TOKENS_LIST])

          const tokensWhitelist = TOKENS_LIST
          const tokensImportedAddresses = computed(() => (unref(props?.tokensImported) ?? []).map((x) => x.address))

          const areImportedTokensPending = props?.areImportedTokensPending ?? ref(false)

          provide(TOASTS_API_KEY, defineToastsApi())
          provide(minimalTokensApiKey, {
            lookupBalance: (a) =>
              new Wei(BigInt(tokens.value.findIndex((x) => x.address === a)) * 1_876_000_141_785_000_000n),
            lookupDerivedUsd: () => null,
            getToken:
              props?.customGetToken ??
              (async () => {
                throw new Error('unimplemented')
              }),
            lookupToken: (a) => {
              const regex = new RegExp('^' + a + '$', 'i')
              if (areImportedTokensPending.value && tokensImportedAddresses.value.find((x) => regex.test(x))) {
                return null
              }
              return tokens.value.find((x) => regex.test(x.address)) ?? null
            },
            isSmartContract: async () => true,
          })

          const model = props?.model ?? ref(null)

          const bindings = reactive({
            tokensImportedAddresses,
            tokensWhitelist,
            selected: props?.selected ?? null,
            areImportedTokensPending,
          })

          return {
            model,
            bindings,
          }
        },
        template: `<TokenSelectPure v-model:token="model" v-bind="bindings" />`,
      },
      {
        global: {
          stubs: { transition: false },
        },
      },
    )
  }

  const TESTID_RECENT_TOKEN = testid('modal-recent-token')
  const TESTID_LIST_ITEM = testid('modal-list-item')
  const TESTID_SEARCH = testid('modal-search')
  const TESTID_IMPORTED_LOADER = testid('modal-imported-loader')
  const TESTID_SELECT = testid('token-select')
  const TESTID_CLOSE_MODAL_BTN = testid('klay-modal-card-close-button')

  const UNKNOWN_TOKEN = '0x85c32ca7e071823b781dda7a43f213258c931c94' as Address

  const IMPORTED_TOKENS: Token[] = [
    {
      name: 'Klay LP 1',
      address: '0xcaa17dd94f9c140dde7ef836514b818a5ffc817e' as Address,
      symbol: 'KlayLP1' as CurrencySymbol,
      decimals: 18,
    },
    {
      name: 'Klay LP 2',
      address: '0xc0a12b1e0229a8f9c9ad1d9eddfb617cc6523531' as Address,
      symbol: 'KlayLP2' as CurrencySymbol,
      decimals: 18,
    },
  ]

  const openModal = () => cy.get(TESTID_SELECT).click()

  it('renders the list of tokens', () => {
    mountFactory()
  })

  it('selected token is disabled', () => {
    const token = TOKENS_LIST.at(4)!

    mountFactory({ selected: new Set([token.address]) })

    openModal()
    cy.get(TESTID_LIST_ITEM).contains(token.symbol).should('have.css', 'pointer-events', 'none')
    cy.get(TESTID_RECENT_TOKEN).contains(token.symbol).should('have.css', 'pointer-events', 'none')
  })

  it('selected token with lowercase addr is disabled too', () => {
    const token = TOKENS_LIST.at(4)!

    mountFactory({ selected: new Set([token.address.toLowerCase() as Address]) })

    openModal()
    cy.get(TESTID_LIST_ITEM).contains(token.symbol).should('have.css', 'pointer-events', 'none')
    cy.get(TESTID_RECENT_TOKEN).contains(token.symbol).should('have.css', 'pointer-events', 'none')
  })

  it('multiple selected tokens are disabled', () => {
    const tokens = [TOKENS_LIST.at(2)!, TOKENS_LIST.at(5)!]

    mountFactory({ selected: new Set(tokens.map((x) => x.address)) })

    openModal()
    for (const token of tokens) {
      cy.get(TESTID_LIST_ITEM).contains(token.symbol).should('have.css', 'pointer-events', 'none')
      cy.get(TESTID_RECENT_TOKEN).contains(token.symbol).should('have.css', 'pointer-events', 'none')
    }
  })

  it('token, selected with `token` prop, is disabled too', () => {
    const token = TOKENS_LIST.at(2)!

    mountFactory({ model: ref(token?.address) })

    openModal()
    cy.get(TESTID_LIST_ITEM).contains(token.symbol).should('have.css', 'pointer-events', 'none')
  })

  it('search does not apply to "popular" tokens', () => {
    mountFactory()

    openModal()
    cy.get(TESTID_SEARCH).type('i do not exist')
    for (const token of TOKENS_LIST.slice(0, 6)) {
      cy.get(TESTID_RECENT_TOKEN).contains(token.symbol).should('exist')
    }
  })

  it('search works with token name, symbol & address', () => {
    mountFactory()

    openModal()

    cy.get(TESTID_SEARCH).type('saturn')
    cy.get(TESTID_LIST_ITEM).contains('SAT').should('exist')

    cy.get(TESTID_SEARCH).clear().type('JUP')
    cy.get(TESTID_LIST_ITEM).contains('Jupiter').should('exist')

    cy.get(TESTID_SEARCH).clear().type('0x246C989333Fa3C3247C7171F6bca68062172992C'.toLowerCase())
    cy.get(TESTID_LIST_ITEM).contains('IO').should('exist')
  })

  it('when imported are pending, then loader is shown', () => {
    mountFactory({ areImportedTokensPending: ref(true) })

    openModal()

    cy.get(TESTID_IMPORTED_LOADER).should('exist')
  })

  it('if imported token is selected and it is not loaded yet, then loader is displayed in TokenSelect', () => {
    mountFactory({
      areImportedTokensPending: ref(true),
      tokensImported: ref(IMPORTED_TOKENS),
      model: ref(IMPORTED_TOKENS.at(0)!.address),
    })

    cy.get(TESTID_SELECT).should('have.class', 's-button_loading')
  })

  describe('When unknown token is selected', () => {
    const mountFactoryWithImportedAndUnknown = () =>
      mountFactory({
        tokensImported: ref(IMPORTED_TOKENS),
        model: ref(UNKNOWN_TOKEN),
        customGetToken: async (x): Promise<Token> => {
          return {
            name: 'Cypress token',
            symbol: 'CYP' as CurrencySymbol,
            address: x,
            decimals: 18,
          }
        },
      })

    it('Select shows "Unknown" token', () => {
      mountFactoryWithImportedAndUnknown()

      cy.get(TESTID_SELECT).contains('Unknown')
    })

    it('The modal has an address inserted into the search input', () => {
      mountFactoryWithImportedAndUnknown()

      openModal()
      cy.get(TESTID_SEARCH).should('have.value', UNKNOWN_TOKEN)
    })

    it('The modal calls `getToken` on opening', () => {
      mountFactoryWithImportedAndUnknown()

      openModal()

      cy.get(TESTID_LIST_ITEM).contains('CYP').should('exist')
    })

    it("When the modal's search is mutated, the select is set to null", () => {
      mountFactoryWithImportedAndUnknown()

      openModal()
      cy.contains('CYP').should('exist')
      cy.get(TESTID_SEARCH).type('{backspace}')

      // wait until search debounce effect
      cy.contains('CYP').should('not.exist')

      cy.get(TESTID_CLOSE_MODAL_BTN).click()
      cy.get(TESTID_SELECT).contains('Select Token')
    })

    it('If user select some token from the recent ones, then the token is selected', () => {
      mountFactoryWithImportedAndUnknown()

      openModal()
      cy.get(TESTID_RECENT_TOKEN).first().click()
      cy.get(TESTID_SELECT).contains('KlayLP1')
    })
  })
})
