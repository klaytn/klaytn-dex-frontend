import { TokenAmount, TokenImpl, Wei } from '@/core'
import { MaybeRef } from '@vueuse/core'

interface Props {
  inputToken: MaybeRef<TokenImpl | null>
  outputToken: MaybeRef<TokenImpl | null>
  inputAmountInWei: MaybeRef<Wei | null>
  outputAmountInWei: MaybeRef<Wei | null>
}

export function useTokenAmounts(props: Props) {
  return computed(() => {
    // unrefProps() ?
    const inputToken = unref(props.inputToken)
    const outputToken = unref(props.outputToken)
    const inputAmountInWei = unref(props.inputAmountInWei)
    const outputAmountInWei = unref(props.outputAmountInWei)
    if (!inputToken || !outputToken || !inputAmountInWei || !outputAmountInWei) return null
    return {
      inputAmount: TokenAmount.fromWei(inputToken, inputAmountInWei),
      outputAmount: TokenAmount.fromWei(outputToken, outputAmountInWei),
    }
  })
}
