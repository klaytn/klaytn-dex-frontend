import { JsonFragment } from '@ethersproject/abi'
import { DexFactory, DexPair, DexRouter, Farming, KIP7, Multicall, StakingFactory, WETH9 } from './typechain'

function takeDefault<T>(fn: () => Promise<{ default: T }>): () => Promise<T> {
  return () => fn().then((x) => x.default)
}

export type RawABI = readonly JsonFragment[]

export const ABIs: Record<AvailableAbi, () => Promise<RawABI>> = {
  kip7: takeDefault(() => import('~abi/kip-7')),
  pair: takeDefault(() => import('~abi/pair')),
  router: takeDefault(() => import('~abi/router')),
  factory: takeDefault(() => import('~abi/factory')),
  weth: takeDefault(() => import('~abi/weth')),
  farming: takeDefault(() => import('~abi/farming')),
  staking: takeDefault(() => import('~abi/staking')),
  multicall: takeDefault(() => import('~abi/multicall')),
  erc20: () => import('./smartcontracts/erc20.json').then((x) => x.default),
}

export type AvailableAbi = keyof AbiContract

export interface AbiContract {
  kip7: KIP7
  pair: DexPair
  router: DexRouter
  factory: DexFactory
  weth: WETH9
  farming: Farming
  staking: StakingFactory
  multicall: Multicall
  erc20: any
}

export type AbiToContract<T extends AvailableAbi> = AbiContract[T]

export class AbiLoader {
  #cache: { [K in AvailableAbi]?: RawABI } = {}

  public get(key: AvailableAbi): RawABI | null {
    return this.#cache[key] ?? null
  }

  public async load(key: AvailableAbi): Promise<RawABI> {
    const loaded = await ABIs[key]()
    this.#cache[key] = loaded
    return loaded
  }
}
