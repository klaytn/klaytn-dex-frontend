import PoolHead from '@/modules/ModuleStaking/PoolHead.vue'
import BigNumber from 'bignumber.js'

it('playground', () => {
  cy.viewport(1000, 300)

  cy.mount(() =>
    h('div', { class: 'p-4 space-y-4' }, [
      h(PoolHead, {
        rewardTokenSymbol: 'MER',
        stakeTokenSymbol: 'VEN',
        earned: new BigNumber(44120.441),
        totalStakedUsd: new BigNumber(998144.412),
        annualPercentageRate: new BigNumber(0.22341),
        endsIn: 0,
      }),
      h(PoolHead, {
        rewardTokenSymbol: 'JUP',
        stakeTokenSymbol: 'KDEX',
        earned: new BigNumber(0),
        totalStakedUsd: new BigNumber(0.23124),
        annualPercentageRate: new BigNumber(8811),
        endsIn: 4491,
      }),
    ]),
  )
})
