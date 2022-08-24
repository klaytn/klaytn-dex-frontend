import { Address, DexPure, Wei } from '@/core'
import { TokensPair, TokenType } from '@/utils/pair'
import { Ref } from 'vue'
import Debug from 'debug'

const debug = Debug('swap-amounts')

export interface GetAmountProps extends TokensPair<Address> {
  amountFor: TokenType
  referenceValue: Wei
}

async function getAmount(props: GetAmountProps & { dex: DexPure }): Promise<Wei> {
  const addrsPair = { addressA: props.tokenA, addressB: props.tokenB }

  const refValue = props.referenceValue

  if (props.amountFor === 'tokenB') {
    const [, amountOut] = await props.dex.swap.getAmounts({
      mode: 'out',
      amountIn: refValue,
      ...addrsPair,
    })

    return amountOut
  } else {
    const [amountIn] = await props.dex.swap.getAmounts({
      mode: 'in',
      amountOut: refValue,
      ...addrsPair,
    })

    return amountIn
  }
}

export function useGetAmount(props: Ref<null | GetAmountProps>) {
  const dexStore = useDexStore()
  const { notify } = useNotify()

  const scope = useParamScope(
    computed(() => {
      const anyDex = dexStore.anyDex

      const propsValue = props.value
      return (
        propsValue && {
          key: `dex-${anyDex.key}-${propsValue.tokenA}-${propsValue.tokenB}-for-${propsValue.amountFor}-${propsValue.referenceValue}`,
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
        set(getAmount({ ...props, dex }))
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
