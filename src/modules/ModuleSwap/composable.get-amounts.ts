import { TokensPair, TokenType } from '@/utils/pair'
import { Ref } from 'vue'
import Debug from 'debug'
import { Trade, SwapPure, Wei, Percent, TokenAmount, TokenImpl, Token } from '@/core'
import {
  AmountsExactIn,
  AmountsExactOut,
  AmountsInOut,
  applySlippageForExactInput,
  applySlippageForExactOutput,
  parseSlippage,
} from '@/core/domain/swap'

const debug = Debug('swap-amounts')

export interface GetAmountsProps {
  amountFor: TokenType
  referenceValue: Wei
  trade: Trade
}

export interface GetAmountsResult extends AmountsInOut {
  mode: 'exact-in' | 'exact-out'
}

async function getAmounts({
  trade,
  amountFor,
  referenceValue,
  swap,
}: GetAmountsProps & { swap: SwapPure }): Promise<GetAmountsResult> {
  if (amountFor === 'tokenB') {
    const mode = 'exact-in'
    const amounts = await swap.getAmounts({ mode, amountIn: referenceValue, trade })
    return { mode, ...amounts }
  } else {
    const mode = 'exact-out'
    const amounts = await swap.getAmounts({ mode, amountOut: referenceValue, trade })
    return { mode, ...amounts }
  }
}

export function useSwapAmounts(props: Ref<null | GetAmountsProps>) {
  const dexStore = useDexStore()
  const { notify } = useNotify()

  const scope = useParamScope(
    computed(() => {
      const anyDex = dexStore.anyDex

      const propsValue = props.value
      return (
        propsValue && {
          key:
            `dex-${anyDex.key}-${propsValue.trade.route.toString()}` +
            `-for-${propsValue.amountFor}-${propsValue.referenceValue}`,
          payload: { props: propsValue, dex: anyDex.dex() },
        }
      )
    }),
    ({ props, dex: { swap } }) => {
      debug('setting amounts: %o', props)

      const { state, run } = useTask(() => getAmounts({ ...props, swap }), { immediate: true })

      usePromiseLog(state, 'swap-get-amount')
      useNotifyOnError(state, notify, 'Failed to compute amount')

      return { state, run }
    },
  )

  const gettingFor = computed<null | TokenType>(() => {
    const x = scope.value
    return x?.expose.state.pending ? x.payload.props.amountFor : null
  })

  const result = computed(() => {
    const x = scope.value

    return x?.expose.state.fulfilled
      ? {
          amountsResult: x.expose.state.fulfilled.value,
          props: x.payload.props,
        }
      : null
  })

  const gotFor = computed(() => {
    if (!result.value) return null

    const {
      props: { amountFor },
      amountsResult,
    } = result.value

    const amount = amountFor === 'tokenA' ? amountsResult.amountIn : amountsResult.amountOut

    return { amountFor, amount }
  })

  const touch = () => scope.value?.expose.run()

  return { gotAmountFor: gotFor, gettingAmountFor: gettingFor, gotResult: result, touch }
}

export type AmountsAdjusted = ({ mode: 'exact-in' } & AmountsExactIn) | ({ mode: 'exact-out' } & AmountsExactOut)

export function useSlippage(
  amounts: Ref<null | undefined | GetAmountsResult>,
  slippage: Ref<Percent>,
): Ref<null | AmountsAdjusted> {
  return computed((): null | AmountsAdjusted => {
    const result = amounts.value
    if (!result) return null

    const slippageParsed = parseSlippage(slippage.value)

    if (result.mode === 'exact-in') {
      const { amountOutMin } = applySlippageForExactInput(result.amountOut, slippageParsed)
      return { mode: 'exact-in', amountIn: result.amountIn, amountOutMin }
    }

    const { amountInMax } = applySlippageForExactOutput(result.amountIn, slippageParsed)
    return { mode: 'exact-out', amountOut: result.amountOut, amountInMax }
  })
}

export type SlippageParsed =
  | { kind: 'exact-in'; amountOutMin: TokenAmount }
  | { kind: 'exact-out'; amountInMax: TokenAmount }

export function useSlippageParsed({
  tokens,
  amounts,
}: {
  tokens: TokensPair<null | Token>
  amounts: Ref<null | AmountsAdjusted>
}) {
  const slippageDataParsed = computed((): null | SlippageParsed => {
    const data = amounts.value
    const { tokenA, tokenB } = tokens
    if (!data || !tokenA || !tokenB) return null

    if (data.mode === 'exact-in')
      return {
        kind: data.mode,
        amountOutMin: TokenAmount.fromWei(new TokenImpl(tokenB), data.amountOutMin as Wei),
      }
    return {
      kind: data.mode,
      amountInMax: TokenAmount.fromWei(new TokenImpl(tokenA), data.amountInMax as Wei),
    }
  })

  return slippageDataParsed
}
