import { TokenType, TokensPair } from '@/utils/pair'
import { Ref } from 'vue'
import Debug from 'debug'
import { Percent, SwapPure, Token, TokenAmount, TokenImpl, Trade, Wei } from '@/core'
import {
  AmountsExactIn,
  AmountsExactOut,
  GetAmountsReturn,
  applySlippageForExactInput,
  applySlippageForExactOutput,
} from '@/core/domain/swap'
import { parseSlippage } from '@/core/slippage'
import { match } from 'ts-pattern'

const debug = Debug('swap-amounts')

export interface GetAmountsProps {
  amountFor: TokenType
  referenceValue: Wei
  trade: Trade
}

export interface GetAmountsResult extends GetAmountsReturn {
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
    ({
      payload: {
        props,
        dex: { swap },
      },
    }) => {
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

export function computeSlippage(result: GetAmountsResult, slippage: Percent): AmountsAdjusted {
  const slippageParsed = parseSlippage(slippage)

  return match(result)
    .with({ mode: 'exact-in' }, ({ mode, amountIn, amountOut }): AmountsAdjusted => {
      const { amountOutMin } = applySlippageForExactInput(amountOut, slippageParsed)
      return { mode, amountIn, amountOutMin }
    })
    .with({ mode: 'exact-out' }, ({ mode, amountIn, amountOut }): AmountsAdjusted => {
      const { amountInMax } = applySlippageForExactOutput(amountIn, slippageParsed)
      return { mode, amountOut, amountInMax }
    })
    .exhaustive()
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
