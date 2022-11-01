import PopperInfo from '@/components/InputTokenPopperInfo.vue'
import BigNumber from 'bignumber.js'

it('playground', () => {
  cy.mount(() =>
    h(PopperInfo, {
      token: { address: '0x004412424242123412341235', symbol: 'MER', name: 'Mercury' },
      balance: new BigNumber(551.234),
      derivedUsd: new BigNumber(0.12),
    }),
  )
})
