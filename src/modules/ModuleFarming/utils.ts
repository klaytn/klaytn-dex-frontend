import { ValueWei, tokenWeiToRaw, tokenRawToWei } from '@/core/kaikas'

const CONSTANT_FARMING_DECIMALS = Object.freeze({ decimals: 18 })

export function farmingFromWei(value: ValueWei<string>): string {
  return tokenWeiToRaw(CONSTANT_FARMING_DECIMALS, value)
}

export function farmingToWei(value: string): ValueWei<string> {
  return tokenRawToWei(CONSTANT_FARMING_DECIMALS, value)
}
