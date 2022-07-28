import TokenSelectModal from '@/components/TokenSelect/Modal.vue'
import { Address, Token, Wei } from '@/core/kaikas'
import { WHITELIST_TOKENS } from '@/core/kaikas/const'
import { TokenWithOptionBalance } from '@/store/tokens'

describe('Token select modal', () => {
  function mountFactory() {
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

          return { tokens, getToken, lookupToken, isSmartContract }
        },
        template: `
        <TokenSelectModal
          open
          :selected="null"
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
})
