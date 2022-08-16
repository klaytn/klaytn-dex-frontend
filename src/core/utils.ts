import { Contract } from 'ethers'
import { isAddress as ethersIsAddress } from '@ethersproject/address'
import type { Address, Deadline } from './types'
import { Wei } from './entities'

export const isAddress = ethersIsAddress as (raw: string) => raw is Address

export function formatAddress(address: Address): string {
  return `${address.slice(2, 6)}....${address.slice(-4)}`
}

export function isEmptyAddress(address: Address): boolean {
  return Number(address) === 0
}

export function parseAddress(raw: string): Address {
  if (isAddress(raw)) return raw
  throw new Error(`not a valid address: "${raw}"`)
}

export function deadlineFiveMinutesFromNow(): Deadline {
  return (~~(Date.now() / 1000) + 300) as Deadline
}

export interface UniContractMethod {
  estimateGas: () => Promise<bigint>
  send: () => Promise<void>
}

export function universalizeContractMethod<T extends Contract, K extends string>(
  contract: T,
  method: K,
  params: Parameters<T[K]> & Parameters<T['estimateGas'][K]>,
): UniContractMethod {
  return {
    estimateGas: () => contract.estimateGas[method](...params).then((x) => x.toBigInt()),
    send: async () => {
      await contract[method](...params)
    },
  }
}

/**
 * @param gasPrice price for one gas unit, in **wei**
 * @param gas amount of gas units
 */
export function computeTransactionFee(gasPrice: Wei, gas: number | bigint): Wei {
  return new Wei(gasPrice.asBigInt * BigInt(gas))
}
