<script setup lang="ts">
import { PoolId, CurrencySymbol, WeiAsToken } from '@/core'
import { formatCurrency } from '@/utils/composable.currency-input'
import BigNumber from 'bignumber.js'
import { ModalOperation } from './types'
import InputTokenLp from '@/components/InputTokenLp.vue'
import { TokensPair } from '@/utils/pair'
import { farmingToWei } from './utils'

const props = defineProps<{
  operation: ModalOperation
  poolId: PoolId
  staked: WeiAsToken<BigNumber>
  balance: WeiAsToken<BigNumber>
  symbols: null | TokensPair<CurrencySymbol>
}>()

const emit = defineEmits<(e: 'staked' | 'unstaked', amount: WeiAsToken<BigNumber>) => void>()

const { notify } = useNotify()
const dexStore = useDexStore()
const tokensStore = useTokensStore()

const inputAmount = shallowRef(new BigNumber(0) as WeiAsToken<BigNumber>)

const label = computed(() => {
  const { operation, staked } = props
  if (operation === ModalOperation.Stake) {
    if (staked.isZero()) {
      return 'Stake LP tokens'
    } else {
      return 'Stake additional LP tokens'
    }
  } else {
    return 'Unstake LP tokens'
  }
})

const notEnough = computed(() => {
  const compareValue = props.operation === ModalOperation.Stake ? props.balance : props.staked
  return new BigNumber(inputAmount.value).isGreaterThan(compareValue)
})

const lessThanOrEqualToZero = computed(() => {
  return inputAmount.value.isLessThanOrEqualTo(0)
})

const disabled = logicOr(notEnough, lessThanOrEqualToZero)

function setMax() {
  inputAmount.value = props.operation === ModalOperation.Stake ? props.balance : props.staked
}

const { state: operationState, run: confirm } = useTask(async () => {
  const dex = dexStore.getNamedDexAnyway()
  const { operation, poolId } = props

  const amount = inputAmount.value
  const amountWei = farmingToWei(amount)

  if (operation === 'stake') await dex.earn.farming.deposit({ poolId: props.poolId, amount: amountWei })
  else dex.earn.farming.withdraw({ poolId, amount: amountWei })

  return { amount, operation }
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

  tokensStore.touchUserBalance()
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
        :symbols="symbols"
        @click:max="setMax"
      >
        <template #bottom-right>
          <template v-if="operation === ModalOperation.Stake">
            <span :class="$style.bottomLine">Balance:</span>
            <CurrencyFormatTruncate
              :class="$style.bottomLine"
              :amount="balance"
            />
          </template>
          <template v-else>
            <span :class="$style.bottomLine">Staked:</span>
            <CurrencyFormatTruncate
              :class="$style.bottomLine"
              :amount="staked"
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
