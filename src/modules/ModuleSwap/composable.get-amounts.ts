import { TokenType } from '@/utils/pair'
import { Ref } from 'vue'
import Debug from 'debug'
import { Trade, DexPure, Wei } from '@/core'

const debug = Debug('swap-amounts')

export interface GetAmountsProps {
  amountFor: TokenType
  referenceValue: Wei
  trade: Trade
}

async function getAmounts(props: GetAmountsProps & { dex: DexPure }): Promise<Wei> {
  const { trade } = props
  const refValue = props.referenceValue

  if (props.amountFor === 'tokenB') {
    const [, amountOut] = await props.dex.swap.getAmounts({
      mode: 'out',
      amountIn: refValue,
      trade,
    })

    return amountOut
  } else {
    const [amountIn] = await props.dex.swap.getAmounts({
      mode: 'in',
      amountOut: refValue,
      trade,
    })

    return amountIn
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
    ({ props, dex }) => {
      debug('setting amounts: %o', props)

      const { set, state } = usePromise<Wei>()
      usePromiseLog(state, 'swap-get-amount')
      useNotifyOnError(state, notify, 'Failed to compute amount')

      function run() {
        set(getAmounts({ ...props, dex }))
      }

      run()

      return state
    },
  )

  const gettingFor = computed<null | TokenType>(() => {
    const x = scope.value
    return x?.expose.pending ? x.payload.props.amountFor : null
  })

  const gotFor = computed(() => {
    const x = scope.value

    return x?.expose.fulfilled
      ? {
          amount: x.expose.fulfilled.value,
          props: x.payload.props,
        }
      : null
  })

  return { gotAmountFor: gotFor, gettingAmountFor: gettingFor }
}
