import { Address, Kaikas, ValueWei } from '@/core/kaikas'
import { TokensPair, TokenType } from '@/utils/pair'
import { Ref } from 'vue'
import Debug from 'debug'

const debug = Debug('swap-amounts')

export interface GetAmountProps extends TokensPair<Address> {
  amountFor: TokenType
  referenceValue: ValueWei<string>
}

async function getAmount(props: GetAmountProps & { kaikas: Kaikas }): Promise<ValueWei<string>> {
  const addrsPair = { addressA: props.tokenA, addressB: props.tokenB }

  const refValue = props.referenceValue

  if (props.amountFor === 'tokenB') {
    const [, amountOut] = await props.kaikas.swap.getAmounts({
      mode: 'out',
      amountIn: refValue,
      ...addrsPair,
    })

    return amountOut
  } else {
    const [amountIn] = await props.kaikas.swap.getAmounts({
      mode: 'in',
      amountOut: refValue,
      ...addrsPair,
    })

    return amountIn
  }
}

export function useGetAmount(props: Ref<null | GetAmountProps>) {
  const kaikasStore = useKaikasStore()

  const scope = useParamScope(
    computed(() => {
      const val = props.value
      if (!val) return null
      return {
        key: `${val.tokenA}-${val.tokenB}-for-${val.amountFor}-${val.referenceValue}`,
        payload: val,
      }
    }),
    (actualProps) => {
      debug('setting amounts: %o', actualProps)

      const { set, state } = usePromise<ValueWei<string>>()
      usePromiseLog(state, 'swap-get-amount')
      useNotifyOnError(state, 'Failed to compute amount')

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
