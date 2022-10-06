import { Plugin, RouteName } from '@/types'

export const install: Plugin = ({ router }) => {
  router.beforeEach((to, from, next) => {
    const store = useLiquidityRmSelectionStore()
    if (to.name === RouteName.LiquidityRemove && !store.isThereSelectionStored) next({ name: RouteName.Liquidity })
    else next()
  })
}
