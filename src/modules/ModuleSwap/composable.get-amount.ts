import { Address, Kaikas, Wei } from '@/core/kaikas'
import { TokensPair, TokenType } from '@/utils/pair'
import { useScope, useTask } from '@vue-kakuyaku/core'
import invariant from 'tiny-invariant'
import { Ref } from 'vue'
import Debug from 'debug'

const debug = Debug('swap-get-amount')

export interface GetAmountProps extends TokensPair<Address> {
  amountFor: TokenType
  referenceValue: Wei
}

async function getAmount(props: GetAmountProps & { kaikas: Kaikas }): Promise<Wei> {
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

  const computedKey = computed<string | null>(() => {
    const val = props.value
    if (!val) return null
    return `${val.tokenA}-${val.tokenB}-for-${val.amountFor}-${val.referenceValue}`
  })
  const taskKey = ref<null | string>(computedKey.value)
  function updateKey() {
    taskKey.value = computedKey.value
  }
  const updateKeyDebounced = useDebounceFn(updateKey, 500)
  function update(immediate = false) {
    debug('update', { immediate })
    immediate ? updateKey() : updateKeyDebounced()
  }
  watch(computedKey, (key) => {
    debug('computed key updated:', key)
    taskKey.value = null
    update()
  })

  const taskScope = useScope(taskKey, () => {
    const kaikas = kaikasStore.getKaikasAnyway()
    const propsVal = props.value
    invariant(propsVal)
    debug('task scope setup. props:', propsVal)

    const task = useTask(async () => {
      const amount = await getAmount({
        kaikas,
        ...propsVal,
      })

      return { amount }
    })

    task.run()
    useTaskLog(task, `get-amounts`)

    return { task, props: propsVal }
  })

  const gettingAmountFor = computed<null | TokenType>(() => {
    if (taskScope.value?.setup.task.state.kind === 'pending') return taskScope.value.setup.props.amountFor
    return null
  })

  const gotAmountFor = computed<null | { type: TokenType; amount: Wei }>(() => {
    const setup = taskScope.value?.setup

    return setup?.task.state.kind === 'ok'
      ? {
          amount: setup.task.state.data.amount,
          type: setup.props.amountFor,
        }
      : null
  })

  return { gotAmountFor, gettingAmountFor, trigger: update }
}
