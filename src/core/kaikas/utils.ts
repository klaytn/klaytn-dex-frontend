import web3 from 'web3'
import type { Address, Token, Deadline } from './types'
import { MAGIC_GAS_PRICE, NATIVE_TOKEN } from './const'
import { shortenStringInTheMiddle } from '@/utils/common'
import Wei from './Wei'

export function formatAddress(address: Address): string {
  return shortenStringInTheMiddle(address)
}

export function isEmptyAddress(address: Address): boolean {
  return Number(address?.slice(2)) === 0
}

export function isNativeToken(address: Address): boolean {
  return address === NATIVE_TOKEN
}

export function isAddress(raw: string): raw is Address {
  return web3.utils.isAddress(raw)
}

export function parseAddress(raw: string): Address {
  if (isAddress(raw)) return raw
  throw new Error(`not a valid address: "${raw}"`)
}

export function sortKlayPair(tokenA: Token, tokenB: Token) {
  if (isNativeToken(tokenA.address)) return [tokenB, tokenA]

  return [tokenA, tokenB]
}

export function deadlineFiveMinutesFromNow(): Deadline {
  return (~~(Date.now() / 1000) + 300) as Deadline
}

/**
 * @param gasPrice price for one gas unit, in **wei**
 * @param gas amount of gas units
 */
export function computeTransactionFee(gasPrice: Wei, gas: number): Wei {
  return new Wei(gasPrice.asBigNum.multipliedBy(gas))
}

if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest

  describe('Formatting address', () => {
    test('some token formatted', () => {
      expect(formatAddress(parseAddress('0xae3a8a1D877a446b22249D8676AFeB16F056B44e'))).toMatchInlineSnapshot(
        '"ae3a...56B4"',
      )
    })
  })

  describe('Empty address check', () => {
    test('native token is not empty', () => {
      expect(isEmptyAddress(NATIVE_TOKEN)).toBe(false)
    })

    test('zero addr is empty', () => {
      expect(isEmptyAddress(parseAddress('0x0000000000000000000000000000000000000000'))).toBe(true)
    })
  })

  describe('compute transaction fee', () => {
    test('fee for 31000 gas', () => {
      // https://www.klaytnfinder.io/tx/0x2200c24c6495372dce76203a9c06661e3524cc7f84e6574d40d604ac629509a9
      expect(computeTransactionFee(MAGIC_GAS_PRICE, 31_000).toToken({ decimals: 18 })).toEqual('0.00775')
    })
  })
}
