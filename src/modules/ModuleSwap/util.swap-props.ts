import { isNativeToken, Trade } from '@/core'
import { SwapProps } from '@/core/domain/swap'
import { AmountsAdjusted } from './composable.get-amounts'
import { excludeKeys } from 'filter-obj'

export interface PropsToBuildSwapProps {
  trade: Trade
  amounts: AmountsAdjusted
  expertMode: boolean
}

export function buildSwapProps({ trade, amounts, expertMode }: PropsToBuildSwapProps): SwapProps {
  const isInputTokenNative = isNativeToken(trade.route.input.address)
  const isOutputTokenNative = isNativeToken(trade.route.output.address)

  const baseProps = { trade, expertMode }

  if (amounts.mode === 'exact-in') {
    // exact A for B

    const rest = {
      ...excludeKeys(amounts, ['mode']),
      ...baseProps,
    }

    return isInputTokenNative
      ? { mode: 'exact-eth-for-tokens', ...rest }
      : isOutputTokenNative
      ? { mode: 'exact-tokens-for-eth', ...rest }
      : { mode: 'exact-tokens-for-tokens', ...rest }
  } else {
    // A for exact B

    const rest = {
      ...excludeKeys(amounts, ['mode']),
      ...baseProps,
    }

    return isInputTokenNative
      ? { mode: 'eth-for-exact-tokens', ...rest }
      : isOutputTokenNative
      ? { mode: 'tokens-for-exact-eth', ...rest }
      : { mode: 'tokens-for-exact-tokens', ...rest }
  }
}
