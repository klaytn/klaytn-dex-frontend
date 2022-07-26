import type { App } from 'vue'
import type { RouteRecordRaw, Router } from 'vue-router'
// import type { HeadClient } from '@vueuse/head'

export interface AppContext<HasRouter extends boolean = true> {
  app: App<Element>
  router: HasRouter extends true ? Router : undefined
  routes: HasRouter extends true ? RouteRecordRaw[] : undefined
  // head: HeadClient | undefined
}

export type Plugin = (ctx: AppContext) => void

export const RouteName = {
  Assets: 'Assets',
  Trade: 'Trade',
  Swap: 'Swap',
  Liquidity: 'Liquidity',
  LiquidityAdd: 'LiquidityAdd',
  LiquidityRemove: 'LiquidityRemove',
  Farms: 'Farms',
  Pools: 'Pools',
  Voting: 'Voting',
  Charts: 'Charts',
} as const

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type RouteName = typeof RouteName[keyof typeof RouteName]

export interface HeaderMenuItem {
  label: string
  routeName: RouteName
  activeWith?: RouteName[]
}
