import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import { BigNumber as EthersBigNumber } from 'ethers'
import { describe, expect, test } from 'vitest'
import Wei, { WeiAsToken } from './Wei'

describe.each([0n, 42n, 15n * 10n ** 18n, 99n * 10n ** 40n])('Wei creation & cast: %s', (NUMBER) => {
  test('from string', () => {
    const str = NUMBER.toString()

    const wei = new Wei(str)

    expect(wei.asBigInt).toEqual(NUMBER)
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
      expect(wei.asBigInt).toEqual(NUMBER)
      expect(wei.asBigNum.toString()).toEqual(new BigNumber(num).toString())
      expect(wei.asBN.toString()).toEqual(new BN(num).toString())
    })
  }

  test('from BigNumber', () => {
    const num = new BigNumber(NUMBER.toString())

    const wei = new Wei(num)

    expect(wei.asBigInt).toEqual(NUMBER)
    expect(wei.asStr).toEqual(NUMBER.toString())
    expect(wei.asBigNum.toFixed()).toEqual(NUMBER.toString())
    expect(wei.asBN.toString()).toEqual(NUMBER.toString())
  })

  test('from BN', () => {
    const num = new BN(NUMBER.toString())

    const wei = new Wei(num)

    expect(wei.asBigInt).toEqual(NUMBER)
    expect(wei.asStr).toEqual(NUMBER.toString())
    expect(wei.asBigNum.toFixed()).toEqual(NUMBER.toString())
    expect(wei.asBN.toString()).toEqual(NUMBER.toString())
  })

  test('from bigint', () => {
    const wei = new Wei(NUMBER)

    expect(wei.asBigInt).toEqual(NUMBER)
    expect(wei.asStr).toEqual(NUMBER.toString())
    expect(wei.asBigNum.toFixed()).toEqual(NUMBER.toString())
    expect(wei.asBN.toString()).toEqual(NUMBER.toString())
  })

  test('from BigNumber (`ethers`)', () => {
    const num = EthersBigNumber.from(NUMBER)

    const wei = new Wei(num)

    expect(wei.asBigInt).toEqual(NUMBER)
    expect(wei.asStr).toEqual(NUMBER.toString())
    expect(wei.asBigNum.toFixed()).toEqual(NUMBER.toString())
    expect(wei.asBN.toString()).toEqual(NUMBER.toString())
  })
})

describe('NaN checks', () => {
  test.each([['412fff'], [NaN], [new BigNumber(NaN)]])('throws when creating Wei from %o', (input) => {
    expect(() => new Wei(input)).toThrowError()
  })

  const NAN_BNJS = new BN(NaN)

  test('not throws with NaN bn.js', () => {
    expect(() => new Wei(NAN_BNJS)).not.toThrowError()
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

describe('Wei <-> Token-Relative value', () => {
  test(`'123.42' to wei`, () => {
    expect(Wei.fromToken({ decimals: 18 }, '123.42' as WeiAsToken).asStr).toEqual(123420000000000000000n.toString())
  })

  test(`'4123' to wei`, () => {
    expect(Wei.fromToken({ decimals: 18 }, '4123' as WeiAsToken).asStr).toEqual((4123n * 10n ** 18n).toString())
  })

  test(`wei to '123.42`, () => {
    expect(new Wei(123420000000000000000n.toString()).toToken({ decimals: 18 })).toEqual('123.42')
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

test('Constructing Wei from "0x" number', () => {
  const wei = new Wei('0x4321')

  expect(wei.asBigInt).toEqual(0x4321n)
  expect(wei.asStr).toEqual((0x4321).toString())
})

test('Constructing Wei from "0o" number', () => {
  const wei = new Wei('0o5512')

  expect(wei.asBigInt).toEqual(0o5512n)
  expect(wei.asStr).toEqual((0o5512).toString())
})

test('Constructing Wei from "0b" number', () => {
  const wei = new Wei('0b111010')

  expect(wei.asBigInt).toEqual(0b111010n)
  expect(wei.asStr).toEqual((0b111010).toString())
})

test('When input BigNumber has decimal points, Wei fails to create', () => {
  expect(() => new Wei(new BigNumber('107379045131102303.26')))
})

test('When Wei is created from unknown type, error is thrown', () => {
  expect(() => new Wei({ message: 'wtf' } as any)).toThrowError()
})

// type tests

type OnlyWei<T extends Wei> = T

interface WeiLike {
  readonly asStr: string
  readonly asBigNum: BigNumber
  readonly asBN: BN
}

// @ts-expect-error
type Error1 = OnlyWei<WeiLike>
