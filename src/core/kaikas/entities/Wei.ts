import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import invariant from 'tiny-invariant'
import { Opaque } from 'type-fest'
import { Token } from '../types'

export type WeiInputValue = number | string | BigNumber | BN | bigint

/**
 * It is a number constructed from Wei using token decimals.
 */
export type WeiAsToken<T extends BigNumber | string = string> = Opaque<T, 'TokenValue'>

/**
 * Useful for typing in cases you need to mark value as wei
 * when it comes from external, i.e. from apollo
 */
export type WeiRaw<T extends WeiInputValue> = Opaque<T, 'WeiRaw'>

type Representation = 'string' | 'BigNumber' | 'BN' | 'bigint'

interface RepresentationMap {
  string: string
  BigNumber: BigNumber
  BN: BN
  bigint: bigint
}

type ReprValue = RepresentationMap[Representation]

type RepresentationMapNullable = {
  [K in keyof RepresentationMap]: null | RepresentationMap[K]
}

function emptyReprMap(): RepresentationMapNullable {
  return { string: null, BigNumber: null, BN: null, bigint: null }
}

function convert<R extends Representation>(value: ReprValue, repr: R): RepresentationMap[R] {
  // naive impl: convert value to bigint, then bigint to repr

  const bi =
    typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint'
      ? BigInt(value)
      : BigNumber.isBigNumber(value)
      ? BigInt(value.toFixed())
      : BigInt(value.toString())

  return (
    repr === 'bigint'
      ? bi
      : repr === 'string'
      ? bi.toString()
      : repr === 'BigNumber'
      ? new BigNumber(bi.toString())
      : new BN(bi.toString())
  ) as RepresentationMap[R]
}

function convertFromExisting<R extends Representation>(map: RepresentationMapNullable, repr: R): RepresentationMap[R] {
  if (map[repr] !== null) return map[repr]!
  if (map.bigint !== null) return convert(map.bigint, repr)
  if (map.string !== null) return convert(map.string, repr)
  if (map.BigNumber !== null) return convert(map.BigNumber, repr)
  if (map.BN !== null) return convert(map.BN, repr)
  throw new EmptyWeiError()
}

function getAndWriteRepr<R extends Representation>(map: RepresentationMapNullable, repr: R): RepresentationMap[R] {
  const value = convertFromExisting(map, repr)
  map[repr] = value
  return value
}

function setRepr(map: RepresentationMapNullable, value: WeiInputValue): void {
  if (typeof value === 'number') {
    invariant(Number.isInteger(value), () => `number should be an integer, got: ${value}`)
    invariant(Number.isSafeInteger(value), 'number should be a safe integer')
    map.string = String(value)
  } else if (typeof value === 'string' || typeof value === 'bigint') {
    // it may be a number in a form like `0x4123`, so let BigInt parse it
    map.bigint = BigInt(value)
  } else if (BigNumber.isBigNumber(value)) {
    map.BigNumber = value
      // `BigNumber` could have decimal places, but `Wei` cannot
      .decimalPlaces(0)
  } else {
    map.BN = value
  }
}

class EmptyWeiError extends Error {
  public readonly message = 'Wei value should not be constructed without initial value'
}

const WeiTag = Symbol('Wei')

type TokenDecimals = Pick<Token, 'decimals'>

export default class Wei {
  public static fromToken({ decimals }: TokenDecimals, token: WeiAsToken): Wei {
    const num = new BigNumber(token).multipliedBy(new BigNumber(10).pow(decimals))
    return new Wei(num)
  }

  #reprs = emptyReprMap()

  private readonly [WeiTag]!: 'Wei'

  public constructor(value: WeiInputValue | Wei) {
    markRaw(this)
    if (value instanceof Wei) {
      this.#reprs = value.#reprs
    } else {
      setRepr(this.#reprs, value)
    }
  }

  public get asStr(): string {
    return getAndWriteRepr(this.#reprs, 'string')
  }

  public get asBigNum(): BigNumber {
    return getAndWriteRepr(this.#reprs, 'BigNumber')
  }

  public get asBN(): BN {
    return getAndWriteRepr(this.#reprs, 'BN')
  }

  public get asBigInt(): bigint {
    return getAndWriteRepr(this.#reprs, 'bigint')
  }

  public toToken({ decimals }: TokenDecimals): WeiAsToken {
    const num = this.asBigNum.dividedBy(new BigNumber(10).pow(decimals))
    return num.toFixed() as WeiAsToken
  }

  public toString(): string {
    return this.asStr
  }

  public toJSON(): string {
    return this.asStr
  }
}
