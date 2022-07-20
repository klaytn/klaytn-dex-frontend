import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import { test, describe, expect } from 'vitest'
import Wei from './Wei'

describe.each([0n, 42n, 15n * 10n ** 18n, 99n * 10n ** 40n])('Wei creation & cast: %s', (NUMBER) => {
  test('from string', () => {
    const str = NUMBER.toString()

    const wei = new Wei(str)

    expect(wei.asBigNum.toFixed()).toEqual(str)
    expect(wei.asBN.toString()).toEqual(str)
    expect(wei.asStr).toEqual(str)
  })

  if (NUMBER <= Number.MAX_SAFE_INTEGER) {
    test('from number', () => {
      const num = Number(NUMBER)
      const numStr = String(num)

      const wei = new Wei(num)

      expect(wei.asStr).toEqual(numStr)
      expect(wei.asBigNum.toString()).toEqual(new BigNumber(num).toString())
      expect(wei.asBN.toString()).toEqual(new BN(num).toString())
    })
  }

  test('from BigNumber', () => {
    const num = new BigNumber(NUMBER.toString())

    const wei = new Wei(num)

    expect(wei.asStr).toEqual(NUMBER.toString())
    expect(wei.asBigNum.toFixed()).toEqual(NUMBER.toString())
    expect(wei.asBN.toString()).toEqual(NUMBER.toString())
  })

  test('from BN', () => {
    const num = new BN(NUMBER.toString())

    const wei = new Wei(num)

    expect(wei.asStr).toEqual(NUMBER.toString())
    expect(wei.asBigNum.toFixed()).toEqual(NUMBER.toString())
    expect(wei.asBN.toString()).toEqual(NUMBER.toString())
  })
})

describe('Construction from a number', () => {
  test('ok if number is less than max safe integer', () => {
    const wei = new Wei(42)

    expect(wei.asStr).toEqual('42')
  })

  test('throws if number is greater than max safe integer', () => {
    expect(() => new Wei(Number.MAX_SAFE_INTEGER + 42)).toThrowError(/should be a safe integer/)
    expect(() => new Wei(Number.MAX_SAFE_INTEGER + 1)).toThrowError(/should be a safe integer/)
  })

  test('throws if number is not an integer', () => {
    expect(() => new Wei(0.1)).toThrowError(/should be an integer, got: 0\.1/)
  })
})

test('Wei in a reactive Vue tree works', () => {
  const wei = ref(new Wei(512))

  expect(wei.value.asStr).toEqual('512')
})

test('Wei in a reactive Vue tree is not reactive itself', () => {
  const wei = ref(new Wei(0))

  expect(isReactive(wei.value)).toBe(false)
})

// type tests

declare function getWei(wei: Wei): void

interface WeiLike {
  readonly asStr: string
  readonly asBigNum: BigNumber
  readonly asBN: BN
}

declare const weiLike: WeiLike

// @ts-expect-error
getWei(weiLike)
