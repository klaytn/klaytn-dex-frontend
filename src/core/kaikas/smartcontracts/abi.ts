// TODO create a vite plugin to import it as `AbiItem[]`
// automatically: `import KIP7 from '@smartcontract-abi/kip-7'`
// add typescript shim for existing contracts

import { type AbiItem } from 'caver-js'

import { abi as KIP7_RAW } from './kip-7.json'
import { abi as PAIR_RAW } from './pair.json'
import { abi as ROUTER_RAW } from './router.json'
import { abi as FACTORY_RAW } from './factory.json'
import { abi as WETH_RAW } from './weth.json'
import { abi as FARMING_RAW } from './farming.json'
import { abi as STAKING_RAW } from './staking.json'
import { abi as MULTICALL_RAW } from './multicall.json'

export const KIP7 = KIP7_RAW as AbiItem[]
export const PAIR = PAIR_RAW as AbiItem[]
export const ROUTER = ROUTER_RAW as AbiItem[]
export const FACTORY = FACTORY_RAW as AbiItem[]
export const WETH = WETH_RAW as AbiItem[]
export const FARMING = FARMING_RAW as AbiItem[]
export const STAKING = STAKING_RAW as AbiItem[]
export const MULTICALL = MULTICALL_RAW as AbiItem[]
