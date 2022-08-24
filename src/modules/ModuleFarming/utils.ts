import { Wei, WeiAsToken } from '@/core/kaikas'

export const CONSTANT_FARMING_DECIMALS = Object.freeze({ decimals: 18 })

export function farmingFromWei(wei: Wei): WeiAsToken {
  return wei.toToken(CONSTANT_FARMING_DECIMALS)
}

export function farmingToWei(token: WeiAsToken): Wei {
  return Wei.fromToken(CONSTANT_FARMING_DECIMALS, token)
}
