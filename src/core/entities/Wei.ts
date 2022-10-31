import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import { BigNumber as EthersBigNumber } from '@ethersproject/bignumber'
import invariant from 'tiny-invariant'
import { Opaque } from 'type-fest'
import { Token } from '../types'

export type WeiInputValue = number | string | BigNumber | BN | bigint | EthersBigNumber

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
    map.bigint = BigInt(value)
  } else if (typeof value === 'string' || typeof value === 'bigint') {
    // it may be a number in a form like `0x4123`, so let BigInt parse it
    map.bigint = BigInt(value)
  } else if (value instanceof BigNumber) {
    invariant(!value.isNaN(), 'NaN')
    invariant(value.decimalPlaces(0).eq(value), () => `BigNumber has decimals, but Wei cannot: ${value.toString()}`)
    map.BigNumber = value
  } else if (value instanceof EthersBigNumber) {
    map.bigint = value.toBigInt()
  } else if (value instanceof BN) {
    map.BN = value
  } else {
    throw new Error(`Cannot accept this value as Wei input: ${String(value)}`)
  }
}

class EmptyWeiError extends Error {
  public readonly message = 'Wei value should not be constructed without initial value'
}

const WeiTag = Symbol('Wei')

type TokenDecimals = Pick<Token, 'decimals'>

export default class Wei {
  public static fromToken({ decimals }: TokenDecimals, token: WeiAsToken<string | BigNumber>): Wei {
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

  /**
   * @deprecated
   */
  public toToken(props: TokenDecimals): WeiAsToken {
    return this.decimals(props).toFixed() as WeiAsToken
  }

  public decimals({ decimals }: TokenDecimals): WeiAsToken<BigNumber> {
    const num = this.asBigNum.div(new BigNumber(10).pow(decimals))
    return num as WeiAsToken<BigNumber>
  }

  public toString(): string {
    return this.asStr
  }

  public toJSON(): string {
    return this.asStr
  }
}
