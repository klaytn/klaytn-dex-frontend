declare module '~abi/*' {
  import type { JsonFragment } from '@ethersproject/abi'
  declare const ABI: ReadonlyArray<JsonFragment>
  export default ABI
}
