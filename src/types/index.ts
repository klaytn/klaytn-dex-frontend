import type { App } from 'vue'
import type { RouteRecordRaw, Router } from 'vue-router'
import type { HeadClient } from '@vueuse/head'

export interface AppContext<HasRouter extends boolean = true> {
  app: App<Element>
  router: HasRouter extends true ? Router : undefined
  routes: HasRouter extends true ? RouteRecordRaw[] : undefined
  head: HeadClient | undefined
}

export type Plugin = (ctx: AppContext) => void

export enum RouteName {
  Assets = 'Assets',
  Swap = 'Swap',
  Liquidity = 'Liquidity',
  LiquidityAdd = 'LiquidityAdd',
  LiquidityRemove = 'LiquidityRemove',
  Farms = 'Farms',
  Pools = 'Pools',
  Voting = 'Voting',
  Charts = 'Charts',
}

export interface HeaderMenuItem {
  label: string
  routeName: RouteName
  activeWith?: RouteName[]
}

export interface Klaytn {
  enable: () => string[]
}

export interface Token {
  address: Address
  value: string
  name: string
  price?: string
  symbol: string
  balance: string
}

export type Address = string

export enum KaikasStatus {
  Initial = 'INITIAL',
  NotInstalled = 'NOT_INSTALLED',
  ShouldConnect = 'SHOULD_CONNECT',
  Connected = 'CONNECTED',
}

export enum LiquidityStatus {
  Initial = 'initial',
  Pending = 'pending',
  Success = 'success',
  Error = 'error',
}

export interface Pair {
  userBalance: string
  pairBalance: string
  symbol: string
  name: string
  reserves: {
    _reserve0: string
    _reserve1: string
    _blockTimestampLast: string
    0: string
    1: string
    2: string
  }
  address: Address
  symbolA?: string | undefined
  symbolB?: string | undefined
}
