import { Plugin, RouteName } from '@/types'

export const install: Plugin = ({ router }) => {
  router.afterEach((to, from, next) => {
    const farmingStore = useFarmingStore()
    const stakingStore = useStakingStore()
    if (from.name === RouteName.Farms) farmingStore.reset()
    if (from.name === RouteName.Pools) stakingStore.reset()
  })
}
