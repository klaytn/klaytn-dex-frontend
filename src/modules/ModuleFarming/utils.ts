import { Wei, WeiAsToken } from '@/core'
import BigNumber from 'bignumber.js'

export const CONSTANT_FARMING_DECIMALS = Object.freeze({ decimals: 18 })

export function farmingFromWei(wei: Wei): WeiAsToken<BigNumber> {
  return wei.decimals(CONSTANT_FARMING_DECIMALS)
}

export function farmingToWei(token: WeiAsToken<string | BigNumber>): Wei {
  return Wei.fromToken(CONSTANT_FARMING_DECIMALS, token)
}
