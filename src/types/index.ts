import type { App } from 'vue'
import type { Router } from 'vue-router'

export interface AppContext<HasRouter extends boolean = true> {
  app: App<Element>
  router: HasRouter extends true ? Router : undefined
}

export type Plugin = (ctx: AppContext) => void

export const RouteName = {
  Assets: 'Assets',
  Transactions: 'Transactions',
  Trade: 'Trade',
  Swap: 'Swap',
  Liquidity: 'Liquidity',
  LiquidityAdd: 'LiquidityAdd',
  LiquidityRemove: 'LiquidityRemove',
  Farms: 'Farms',
  Pools: 'Pools',
  Voting: 'Voting',
  VotingProposal: 'VotingProposal',
  Charts: 'Charts',
} as const

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type RouteName = typeof RouteName[keyof typeof RouteName]

export type HeaderMenuItem = {
  label: string
} & (
  | {
      kind: 'route'
      routeName: RouteName
      activeWith?: RouteName[]
    }
  | {
      kind: 'external'
      href: string
    }
)

export const RoiType = {
  Farming: 'farming',
  Staking: 'staking',
} as const

export type RoiType = typeof RoiType[keyof typeof RoiType]

export interface Tab {
  id: string
  label: string
}

export const ApolloClientId = {
  Exchange: 'exchange',
  Farming: 'farming',
  Staking: 'staking',
  Snapshot: 'snapshot',
} as const

export type ApolloClientId = typeof ApolloClientId[keyof typeof ApolloClientId]

export type AllExceptLast<T extends any[]> = T extends [maybe?: any]
  ? []
  : T extends [infer Head, ...infer Tail]
  ? [Head, ...AllExceptLast<Tail>]
  : never

export type OnlyLast<T extends any[]> = T extends [maybe?: infer T]
  ? T
  : T extends [any, ...infer Tail]
  ? OnlyLast<Tail>
  : never

export interface EnvGit {
  revision: string
  branch: string
  /**
   * ISO
   */
  date: string
}
