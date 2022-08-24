import { Kaikas, Wei } from '@/core/kaikas'
import { TokenType } from '@/utils/pair'
import { Ref } from 'vue'
import Debug from 'debug'
import { Route } from '@/core/kaikas/entities'

const debug = Debug('swap-amounts')

export interface GetAmountProps {
  amountFor: TokenType
  referenceValue: Wei
  route: Route
}

async function getAmount(props: GetAmountProps & { kaikas: Kaikas }): Promise<Wei> {
  const route = props.route
  const refValue = props.referenceValue

  if (props.amountFor === 'tokenB') {
    const [, amountOut] = await props.kaikas.swap.getAmounts({
      mode: 'out',
      amountIn: refValue,
      route,
    })

    return amountOut
  } else {
    const [amountIn] = await props.kaikas.swap.getAmounts({
      mode: 'in',
      amountOut: refValue,
      route,
    })

    return amountIn
  }
}

export function useGetAmount(props: Ref<null | GetAmountProps>) {
  const kaikasStore = useKaikasStore()
  const { notify } = useNotify()

  const scope = useParamScope(
    computed(() => {
      const val = props.value
      if (!val) return null
      return {
        key: `${val.route.input.symbol}-${val.route.output.symbol}-for-${val.amountFor}-${val.referenceValue}`,
        payload: val,
      }
    }),
    (actualProps) => {
      debug('setting amounts: %o', actualProps)

      const { set, state } = usePromise<Wei>()
      usePromiseLog(state, 'swap-get-amount')
      useNotifyOnError(state, notify, 'Failed to compute amount')

      function run() {
        set(getAmount({ ...actualProps, kaikas: kaikasStore.getKaikasAnyway() }))
      }

      run()

      return state
    },
  )

  const gettingFor = computed<null | TokenType>(() => {
    const x = scope.value
    return x?.expose.pending ? x.payload.amountFor : null
  })

  const gotFor = computed(() => {
    const x = scope.value

    return x?.expose.fulfilled
      ? {
          amount: x.expose.fulfilled.value,
          props: x.payload,
        }
      : null
  })

  return { gotAmountFor: gotFor, gettingAmountFor: gettingFor }
}
