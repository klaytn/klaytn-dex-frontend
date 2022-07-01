import { type Address, type Token } from './'
import web3 from 'web3'
import { type Unit } from 'web3-utils'
import BN from 'bn.js'
import BigNumber from 'bignumber.js'

const NATIVE_TOKEN = '0xae3a8a1D877a446b22249D8676AFeB16F056B44e' as Address

export function formatAddress(address: Address): string {
  const addressLength = address.length
  return `${address.slice(2, 6)}...${address.slice(addressLength - 6, addressLength - 2)}`
}

export function isEmptyAddress(address: Address): boolean {
  return Number(address?.slice(2)) === 0
}

export function isNativeToken(address: Address): boolean {
  return address === NATIVE_TOKEN
}

export function toWei(token: BN, amount: Unit = 'ether'): BN {
  return web3.utils.toWei(token, amount)
}

export function isAddress(raw: string): raw is Address {
  return web3.utils.isAddress(raw)
}

export function parseAddress(raw: string): Address {
  if (isAddress(raw)) return raw
  throw new Error(`not a valid address: "${raw}"`)
}

export function fromWei(amount: string | BN): string {
  return web3.utils.fromWei(amount)
}

/**
 * FIXME what a weird conversion?
 */
export function bigNumber(amount: BigNumber.Value) {
  return new BigNumber(amount)
}

export function sortKlayPair(tokenA: Token, tokenB: Token) {
  if (isNativeToken(tokenA.address)) return [tokenB, tokenA]

  return [tokenA, tokenB]
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
}
