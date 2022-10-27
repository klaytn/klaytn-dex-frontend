import type { JsonFragment } from '@ethersproject/abi'
import type { Contract as ContractEthers } from 'ethers'
import type * as TypechainEthers from './typechain-ethers'
import type * as TypechainWeb3 from './typechain-web3'
import type { BaseContract as ContractWeb3 } from './typechain-web3/types'

function takeDefault<T>(fn: () => Promise<{ default: T }>): () => Promise<T> {
  return () => fn().then((x) => Object.freeze(x.default))
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

export type AvailableAbi = keyof AbiContractEthers & keyof AbiContractWeb3

export interface AbiContractEthers {
  kip7: TypechainEthers.KIP7
  pair: TypechainEthers.DexPair
  router: TypechainEthers.DexRouter
  factory: TypechainEthers.DexFactory
  weth: TypechainEthers.WETH9
  farming: TypechainEthers.Farming
  staking: TypechainEthers.StakingInitializable
  multicall: TypechainEthers.Multicall
  erc20: ContractEthers
}

export interface AbiContractWeb3 {
  kip7: TypechainWeb3.klaytn.contracts.kip.token.kip7.KIP7
  pair: TypechainWeb3.contracts.swap.DexPair
  router: TypechainWeb3.contracts.swap.DexRouter
  factory: TypechainWeb3.contracts.swap.DexFactory
  weth: TypechainWeb3.contracts.tokens.wklaySol.WETH9
  farming: TypechainWeb3.contracts.farming.Farming
  staking: TypechainWeb3.contracts.farming.stakingFactoryPoolSol.StakingInitializable
  multicall: TypechainWeb3.contracts.utils.multiCallSol.Multicall
  erc20: ContractWeb3
}

export type TypechainTarget = 'ethers' | 'web3'

export type AbiToContract<A extends AvailableAbi, T extends TypechainTarget> = T extends 'web3'
  ? AbiContractWeb3[A]
  : AbiContractEthers[A]

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
