import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import invariant from 'tiny-invariant'

export type WeiInputValue = number | string | BigNumber | BN

type Representation = 'string' | 'BigNumber' | 'BN'

interface RepresentationMap {
  string: string
  BigNumber: BigNumber
  BN: BN
}

type ReprValue = RepresentationMap[Representation]

type RepresentationMapNullable = {
  [K in keyof RepresentationMap]: null | RepresentationMap[K]
}

function emptyReprMap(): RepresentationMapNullable {
  return { string: null, BigNumber: null, BN: null }
}

function convert<R extends Representation>(value: ReprValue, repr: R): RepresentationMap[R] {
  // naive impl: convert value to bigint, then bigint to repr

  const bi =
    typeof value === 'string' || typeof value === 'number'
      ? BigInt(value)
      : BigNumber.isBigNumber(value)
      ? BigInt(value.toFixed())
      : BigInt(value.toString())

  return (
    repr === 'string' ? bi.toString() : repr === 'BigNumber' ? new BigNumber(bi.toString()) : new BN(bi.toString())
  ) as RepresentationMap[R]
}

function convertFromExisting<R extends Representation>(map: RepresentationMapNullable, repr: R): RepresentationMap[R] {
  if (map[repr] !== null) return map[repr]!
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
  } else if (typeof value === 'string') {
    map.string = value
  } else if (BigNumber.isBigNumber(value)) {
    map.BigNumber = value
  } else {
    map.BN = value
  }
}

class EmptyWeiError extends Error {
  public readonly message = 'Wei value should not be constructed without initial value'
}

const WeiTag = Symbol('Wei')

export default class Wei {
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
}
