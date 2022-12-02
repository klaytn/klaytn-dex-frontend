import { isAddress as ethersIsAddress } from '@ethersproject/address'
import type { Address, BigNumberIsh, Deadline } from './types'
import Wei from './entities/Wei'
import BigNumber from 'bignumber.js'
import invariant from 'tiny-invariant'
import { TokensPair } from '@/utils/pair'

export const isAddress = ethersIsAddress as (raw: string) => raw is Address

export function formatAddress(address: Address, length = 4, keepPrefix = false): string {
  return `${address.slice(keepPrefix ? 0 : 2, 2 + length)}....${address.slice(-length)}`
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

/**
 * @param gasPrice price for one gas unit, in **wei**
 * @param gas amount of gas units
 */
export function computeTransactionFee(gasPrice: Wei, gas: number | bigint): Wei {
  return new Wei(gasPrice.asBigInt * BigInt(gas))
}

export function parseBigNumberIsh(value: BigNumberIsh): BigNumber {
  if (typeof value === 'bigint') return new BigNumber(value.toString())
  if (value instanceof BigNumber) return value
  return new BigNumber(value)
}

export function parseBigIntIsh(value: BigNumberIsh): bigint {
  if (typeof value === 'bigint') return value
  const bigNumberValue = parseBigNumberIsh(value)
  invariant(bigNumberValue.isInteger, 'value in not an integer')
  return BigInt(bigNumberValue.toFixed(0))
}

export function areAddressesEqual(a: Address, b: Address): boolean {
  // TODO could be optimized with char-by-char case insensitive comparison
  // taking into account that the whole set of characters is `[A-Fa-f0-9]`
  return a.toLowerCase() === b.toLowerCase()
}

export function areNullableAddressesEqual(a: Address | null, b: Address | null): boolean {
  if (a !== null && b !== null) return areAddressesEqual(a, b)
  if (a === null && b === null) return true
  return false
}
