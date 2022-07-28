import TokenSelectModal from '@/components/TokenSelect/Modal.vue'
import { Wei } from '@/core/kaikas'
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
            balance: new Wei(BigInt(i) * 1_000_000_000n),
          }))

          return { tokens }
        },
        template: `
        <TokenSelectModal
          open
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
})
