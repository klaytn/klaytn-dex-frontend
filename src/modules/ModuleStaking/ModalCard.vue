<script setup lang="ts">
import { ModalOperation } from './types'
import BigNumber from 'bignumber.js'
import { Wei, WeiAsToken, Token, Address } from '@/core'
import invariant from 'tiny-invariant'
import { formatCurrency } from '@/utils/composable.currency-input'

const dexStore = useDexStore()
const tokensStore = useTokensStore()
const { notify } = useNotify()

const { t } = useI18n()

const props = defineProps<{
  poolId: Address
  stakeToken: Pick<Token, 'decimals' | 'symbol'>
  balance: WeiAsToken<BigNumber> | null
  staked: WeiAsToken<BigNumber>
  operation: ModalOperation
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (e: 'staked' | 'unstaked', value: WeiAsToken<BigNumber>): void
}>()

const inputAmount = shallowRef(new BigNumber(0) as WeiAsToken<BigNumber>)

const label = computed(() => {
  if (props.operation === ModalOperation.Stake) {
    return t('ModuleStakingModal.stakeTitle')
  } else {
    return t('ModuleStakingModal.unstakeTitle', { symbol: props.stakeToken.symbol })
  }
})

const notEnough = computed(() => {
  const { balance, operation, staked } = props
  if (!balance) return false

  return operation === ModalOperation.Stake
    ? inputAmount.value.isGreaterThan(balance)
    : inputAmount.value.isGreaterThan(staked)
})

const lessThanOrEqualToZero = computed(() => inputAmount.value.isLessThanOrEqualTo(0))

const disabled = logicOr(notEnough, lessThanOrEqualToZero)

function setPercent(percent: number) {
  let referenceValue: BigNumber

  if (props.operation === 'stake') {
    const { balance } = props
    invariant(balance)
    referenceValue = balance
  } else referenceValue = props.staked

  inputAmount.value = referenceValue.multipliedBy(percent * 0.01) as WeiAsToken<BigNumber>
}

const { state: operationState, run: confirm } = useTask(async () => {
  const amount = inputAmount.value
  const dex = dexStore.getNamedDexAnyway()
  const { stakeToken, operation, poolId } = props

  if (operation === ModalOperation.Stake)
    await dex.earn.staking.deposit({ amount: Wei.fromToken(stakeToken, amount), poolId })
  else await dex.earn.staking.withdraw({ amount: Wei.fromToken(stakeToken, amount), poolId })

  return { amount, operation, stakeToken }
})

usePromiseLog(operationState, 'staking-stake-unstake')

wheneverDone(operationState, (result) => {
  if (result.fulfilled) {
    const {
      amount,
      operation,
      stakeToken: { symbol },
    } = result.fulfilled.value
    const formatted = formatCurrency({ amount, symbol: { str: symbol, position: 'right' } })

    if (operation === ModalOperation.Stake) {
      notify({ type: 'ok', description: `${formatted} tokens were staked` })
      emit('staked', amount)
    } else {
      notify({ type: 'ok', description: `${formatted} tokens were unstaked` })
      emit('unstaked', amount)
    }

    tokensStore.touchUserBalance()
  } else {
    notify({ type: 'err', description: `Failed to confirm operation` })
  }
})

const loading = toRef(operationState, 'pending')
</script>

<template>
  <KlayModalCard
    :title="label"
    class="w-[420px]"
  >
    <div>
      <InputCurrencyTemplate bottom>
        <template #input>
          <CurrencyInput
            v-model="inputAmount"
            :decimals="stakeToken.decimals"
          />
        </template>

        <template #top-right>
          <div class="flex items-center space-x-2">
            <KlayCharAvatar :symbol="stakeToken.symbol" />
            <div>
              {{ stakeToken.symbol }}
            </div>
          </div>
        </template>

        <template #bottom-right>
          <template v-if="operation === ModalOperation.Stake">
            <span
              :class="$style.inputBottom"
              class="whitespace-pre"
            >Balance: </span>
            <CurrencyFormatTruncate
              :amount="balance"
              :class="$style.inputBottom"
            />
          </template>
          <template v-else>
            <span
              :class="$style.inputBottom"
              class="whitespace-pre"
            >Staked: </span>
            <CurrencyFormatTruncate
              :amount="staked"
              :class="$style.inputBottom"
            />
          </template>
        </template>
      </InputCurrencyTemplate>
    </div>

    <div class="grid grid-cols-5 gap-4 mt-2">
      <KlayButton
        v-for="percent in [10, 25, 50, 75]"
        :key="percent"
        size="sm"
        @click="setPercent(percent)"
      >
        {{ percent }}%
      </KlayButton>

      <KlayButton
        type="primary"
        size="sm"
        @click="setPercent(100)"
      >
        MAX
      </KlayButton>
    </div>

    <KlayButton
      type="primary"
      size="lg"
      class="w-full mt-4"
      :disabled="disabled"
      :loading="loading"
      @click="confirm"
    >
      Confirm
    </KlayButton>
  </KlayModalCard>
</template>

<style lang="scss" module>
@use '@/styles/vars';

.inputBottom {
  font-weight: 500;
  font-size: 12px;
  color: vars.$gray2;
}
</style>
