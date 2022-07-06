import web3 from 'web3'
import { type Address, type Token, type Deadline, ValueWei } from './types'
import { NATIVE_TOKEN } from './const'
import BigNumber from 'bignumber.js'

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

export function isAddress(raw: string): raw is Address {
  return web3.utils.isAddress(raw)
}

export function parseAddress(raw: string): Address {
  if (isAddress(raw)) return raw
  throw new Error(`not a valid address: "${raw}"`)
}

export const { fromWei, toWei } = web3.utils

export function sortKlayPair(tokenA: Token, tokenB: Token) {
  if (isNativeToken(tokenA.address)) return [tokenB, tokenA]

  return [tokenA, tokenB]
}

export function deadlineFiveMinutesFromNow(): Deadline {
  return (~~(Date.now() / 1000) + 300) as Deadline
}

export function tokenRawToWei({ decimals }: Pick<Token, 'decimals'>, valueRaw: string): ValueWei<string> {
  return new BigNumber(valueRaw).multipliedBy(new BigNumber(10).pow(decimals)).toString() as ValueWei<string>
}

export function tokenWeiToRaw({ decimals }: Pick<Token, 'decimals'>, wei: ValueWei<string>): string {
  return new BigNumber(wei).dividedBy(new BigNumber(10).pow(decimals)).toString()
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

  describe('Token Wei <-> Raw', () => {
    test('raw to wei', () => {
      expect(tokenRawToWei({ decimals: 18 }, '123.42')).toEqual(123420000000000000000n.toString())
    })

    test('wei to raw', () => {
      expect(tokenWeiToRaw({ decimals: 18 }, 123420000000000000000n.toString() as ValueWei<string>)).toEqual('123.42')
    })
  })
}
