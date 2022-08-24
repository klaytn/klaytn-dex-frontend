import { TokenAmount, Token, Wei } from '@/core/kaikas/entities'
import { MaybeRef } from '@vueuse/core'

export function useTokenAmounts({
  inputToken,
  outputToken,
  inputAmountInWei,
  outputAmountInWei,
}: {
  inputToken: MaybeRef<Token | null>
  outputToken: MaybeRef<Token | null>
  inputAmountInWei: MaybeRef<Wei | null>
  outputAmountInWei: MaybeRef<Wei | null>
}) {
  return computed(() => {
    // unrefArgs() ?
    const args = {
      inputToken: unref(inputToken),
      outputToken: unref(outputToken),
      inputAmountInWei: unref(inputAmountInWei),
      outputAmountInWei: unref(outputAmountInWei),
    }
    if (!args.inputToken || !args.outputToken || !args.inputAmountInWei || !args.outputAmountInWei) return null
    return {
      inputAmount: TokenAmount.fromWei(args.inputToken, args.inputAmountInWei.asBigNum),
      outputAmount: TokenAmount.fromWei(args.outputToken, args.outputAmountInWei.asBigNum),
    }
  })
}
