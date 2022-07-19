import BigNumber from 'bignumber.js'
import BN from 'bn.js'

type WeiValue = number | string | BigNumber | BN | Wei

type Representation = 'number' | 'string' | 'BigNumber' | 'BN'

interface RepresentationMap {
  number: number
  string: string
  BigNumber: BigNumber
  BN: BN
}

type RepresentationMapNullable = {
  [K in keyof RepresentationMap]: null | RepresentationMap[K]
}

function emptyReprMap(): RepresentationMapNullable {}

function convert<R extends Representation>(value: number | string | BigNumber | BN, repr: R): RepresentationMap[R] {}

function convertFromExisting<R extends Representation>(map: RepresentationMapNullable, repr: R): RepresentationMap[R] {
  if (map[repr] !== null) return map[repr]!
  if (map.number !== null) return convert(map.number, repr)
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

function setRepr(map: RepresentationMapNullable, value: number | string | BigNumber | BN): void {}

class EmptyWeiError extends Error {
  public readonly message = 'Wei value should not be constructed without initial value'
}

declare const WeiTag: unique symbol

export default class Wei {
  private readonly reprs = markRaw(emptyReprMap())

  /**
   * For opaqueness
   */
  private readonly [WeiTag]!: 'Wei'

  public constructor(value: WeiValue) {
    if (value instanceof Wei) {
      this.reprs = value.reprs
    } else {
      setRepr(this.reprs, value)
    }
  }

  public get str(): string {
    return getAndWriteRepr(this.reprs, 'string')
  }

  public get num(): number {
    return getAndWriteRepr(this.reprs, 'number')
  }

  public get bignum(): BigNumber {
    return getAndWriteRepr(this.reprs, 'BigNumber')
  }

  public get bn(): BN {
    return getAndWriteRepr(this.reprs, 'BN')
  }
}
