import web3 from 'web3'
import type { Address, Token, Deadline, ValueWei, AnyNumber } from './types'
import { MAGIC_GAS_PRICE, NATIVE_TOKEN } from './const'
import BigNumber from 'bignumber.js'
import BN from 'bn.js'

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

export function asWei<T extends AnyNumber>(value: T): ValueWei<T> {
  return value as ValueWei<T>
}

export function deadlineFiveMinutesFromNow(): Deadline {
  return (~~(Date.now() / 1000) + 300) as Deadline
}

export function tokenRawToWei({ decimals }: Pick<Token, 'decimals'>, valueRaw: string): ValueWei<string> {
  const result = new BigNumber(valueRaw ?? 0)
    .multipliedBy(new BigNumber(10).pow(decimals))
    .toFixed(0) as ValueWei<string>
  return result
}

export function tokenWeiToRaw({ decimals }: Pick<Token, 'decimals'>, wei: ValueWei<string>): string {
  return new BigNumber(wei).dividedBy(new BigNumber(10).pow(decimals)).toString()
}

/**
 * @param gasPrice price for one gas unit, in **wei**
 * @param gas amount of gas units
 */
export function computeTransactionFee(gasPrice: ValueWei<number | string | BN>, gas: number): ValueWei<string> {
  return asWei(new BN(gasPrice).mul(new BN(gas)).toString())
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
    test('raw with decimals to wei', () => {
      expect(tokenRawToWei({ decimals: 18 }, '123.42')).toEqual(123420000000000000000n.toString())
    })

    test('raw with decimals to wei', () => {
      expect(tokenRawToWei({ decimals: 18 }, '4123')).toEqual((4123n * 10n ** 18n).toString())
    })

    test('wei to raw', () => {
      expect(tokenWeiToRaw({ decimals: 18 }, 123420000000000000000n.toString() as ValueWei<string>)).toEqual('123.42')
    })
  })

  describe('compute transaction fee', () => {
    test('fee for 31000 gas', () => {
      // https://www.klaytnfinder.io/tx/0x2200c24c6495372dce76203a9c06661e3524cc7f84e6574d40d604ac629509a9
      expect(tokenWeiToRaw({ decimals: 18 }, computeTransactionFee(MAGIC_GAS_PRICE, 31_000))).toEqual('0.00775')
    })
  })
}
