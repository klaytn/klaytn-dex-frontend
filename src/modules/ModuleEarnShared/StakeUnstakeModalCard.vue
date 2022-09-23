<script setup lang="ts">
import { WeiAsToken } from '@/core'
import { formatCurrency } from '@/utils/composable.currency-input'
import BigNumber from 'bignumber.js'
import { ModalOperation, ModalOperationComposite } from './types'
import InputTokenLp from '@/components/InputTokenLp.vue'

const props = defineProps<{
  operation: ModalOperationComposite
}>()

const emit = defineEmits<(e: 'staked' | 'unstaked', amount: WeiAsToken<BigNumber>) => void>()

const { notify } = useNotify()

const inputAmount = shallowRef(new BigNumber(0) as WeiAsToken<BigNumber>)

const label = computed(() => {
  const { operation } = props
  if (operation.kind === ModalOperation.Stake) {
    if (operation.staked.isZero()) {
      return 'Stake LP tokens'
    } else {
      return 'Stake additional LP tokens'
    }
  } else {
    return 'Unstake LP tokens'
  }
})

const notEnough = computed(() => {
  const { operation } = props
  const compareValue = operation.kind === ModalOperation.Stake ? operation.balance : operation.staked
  return new BigNumber(inputAmount.value).isGreaterThan(compareValue)
})

const lessThanOrEqualToZero = computed(() => {
  return inputAmount.value.isLessThanOrEqualTo(0)
})

const disabled = logicOr(notEnough, lessThanOrEqualToZero)

function setMax() {
  const { operation } = props
  inputAmount.value = operation.kind === ModalOperation.Stake ? operation.balance : operation.staked
}

const { state: operationState, run: confirm } = useTask(async () => {
  const amount = inputAmount.value
  const { operation } = props
  if (operation.kind === ModalOperation.Stake) await operation.stake(amount)
  else await operation.unstake(amount)

  return { amount, operation: operation.kind }
})

wheneverFulfilled(operationState, ({ amount, operation }) => {
  const amountFormatted = formatCurrency({ amount, decimals: 6 })

  if (operation === ModalOperation.Stake) {
    notify({ type: 'ok', description: `${amountFormatted} LP tokens were staked` })
    emit('staked', amount)
  } else {
    notify({ type: 'ok', description: `${amountFormatted} LP tokens were unstaked` })
    emit('unstaked', amount)
  }
})

useNotifyOnError(operationState, notify, 'Failed to confirm operation')

const loading = toRef(operationState, 'pending')
</script>

<template>
  <KlayModalCard
    class="w-[420px]"
    :title="label"
  >
    <div class="space-y-4">
      <InputTokenLp
        v-model="inputAmount"
        :symbols="operation.symbols"
        @click:max="setMax"
      >
        <template #bottom-right>
          <template v-if="operation.kind === ModalOperation.Stake">
            <span :class="$style.bottomLine">Balance:</span>
            <CurrencyFormatTruncate
              :class="$style.bottomLine"
              :amount="operation.balance"
            />
          </template>
          <template v-else>
            <span :class="$style.bottomLine">Staked:</span>
            <CurrencyFormatTruncate
              :class="$style.bottomLine"
              :amount="operation.staked"
            />
          </template>
        </template>
      </InputTokenLp>

      <KlayButton
        type="primary"
        size="lg"
        class="w-full"
        :disabled="disabled"
        :loading="loading"
        @click="confirm"
      >
        Confirm
      </KlayButton>
    </div>
  </KlayModalCard>
</template>

<style module lang="scss">
@use '@/styles/vars';

.bottom-line {
  font-size: 12px;
  font-weight: 400;
  color: vars.$gray2;
}
</style>
