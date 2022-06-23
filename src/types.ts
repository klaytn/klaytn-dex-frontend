import type web3 from 'web3'

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
  address: string
}

export type BN = Parameters<typeof web3.utils.toWei>[0]
