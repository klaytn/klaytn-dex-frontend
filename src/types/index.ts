import { type ViteSSGContext } from 'vite-ssg'

export type Plugin = (ctx: ViteSSGContext) => void

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
