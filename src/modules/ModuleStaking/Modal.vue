<script setup lang="ts" name="ModuleStakingStakeModal">
import { SModal } from '@soramitsu-ui/ui'
import { ModalOperation, Pool } from './types'
import { FORMATTED_BIG_INT_DECIMALS } from './const'
import BigNumber from 'bignumber.js'
import { or } from '@vueuse/core'
import { Wei, WeiAsToken } from '@/core'

const dexStore = useDexStore()
const { notify } = useNotify()

const vBem = useBemClass()
const { t } = useI18n()

const props = defineProps<{
  modelValue: boolean
  pool: Pool
  balance: BigNumber
  operation: ModalOperation
}>()
const { pool, balance, operation } = toRefs(props)
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (e: 'staked' | 'unstaked', value: string): void
}>()

const model = useVModel(props, 'modelValue', emit, { passive: true })

const value = ref<WeiAsToken>('0' as WeiAsToken)

watch(model, () => {
  value.value = '0' as WeiAsToken
})

const formattedStaked = computed(() => {
  return new BigNumber(pool.value.staked.toFixed(FORMATTED_BIG_INT_DECIMALS))
})

const formattedBalance = computed(() => {
  if (balance.value === null) return ''

  return new BigNumber(balance.value.toFixed(FORMATTED_BIG_INT_DECIMALS))
})

const label = computed(() => {
  if (operation.value === ModalOperation.Stake) {
    return t('ModuleStakingModal.stakeTitle')
  } else {
    return t('ModuleStakingModal.unstakeTitle', { symbol: pool.value.stakeToken.symbol })
  }
})

const notEnough = computed(() => {
  if (balance.value === null) return false

  if (operation.value === ModalOperation.Stake) return new BigNumber(value.value).comparedTo(balance.value) === 1
  else return new BigNumber(value.value).comparedTo(pool.value.staked) === 1
})

const lessThanOrEqualToZero = computed(() => {
  return new BigNumber(value.value).comparedTo(0) !== 1
})

const disabled = computed(() => {
  return notEnough.value || lessThanOrEqualToZero.value
})

function setPercent(percent: number) {
  if (operation.value === ModalOperation.Stake)
    value.value = `${balance.value?.multipliedBy(percent * 0.01)}` as WeiAsToken
  else value.value = `${pool.value.staked.multipliedBy(percent * 0.01)}` as WeiAsToken
}

const { state: stakeState, run: stake } = useTask(async () => {
  const amount = value.value
  await dexStore.getNamedDexAnyway().earn.staking.deposit({
    amount: Wei.fromToken(
      // FIXME stake token or reward token?
      pool.value.stakeToken,
      amount,
    ),
  })
  return { amount }
})
usePromiseLog(stakeState, 'stake')
wheneverDone(stakeState, (result) => {
  if (result.fulfilled) {
    const { amount } = result.fulfilled.value
    notify({ type: 'ok', description: `${amount} ${pool.value.stakeToken.symbol} tokens were staked` })
    emit('staked', amount)
  } else {
    notify({ type: 'err', description: `Stake ${pool.value.stakeToken.symbol} tokens error` })
  }
})

const { state: unstakeState, run: unstake } = useTask(async () => {
  const amount = value.value
  await dexStore.getNamedDexAnyway().earn.staking.withdraw({ amount: Wei.fromToken(pool.value.stakeToken, amount) })
  return { amount }
})
usePromiseLog(unstakeState, 'stake')
wheneverDone(unstakeState, (result) => {
  if (result.fulfilled) {
    const { amount } = result.fulfilled.value
    notify({ type: 'ok', description: `${amount} ${pool.value.stakeToken.symbol} tokens were unstaked` })
    emit('unstaked', amount)
  } else {
    notify({
      type: 'err',
      description: `Unstake ${pool.value.stakeToken.symbol} tokens error`,
      error: result.rejected.reason,
    })
  }
})

const loading = or(toRef(stakeState, 'pending'), toRef(unstakeState, 'pending'))

function confirm() {
  switch (operation.value) {
    case ModalOperation.Stake:
      stake()
      break
    case ModalOperation.Unstake:
      unstake()
      break
  }
}
</script>

<template>
  <SModal v-model:show="model">
    <KlayModalCard
      :title="label"
      class="w-[420px]"
    >
      <div v-bem="'row'">
        <div v-bem="'input-wrapper'">
          <KlayTextField
            v-model="value"
            v-bem="'input'"
          />
          <div v-bem="'info'">
            <KlayCharAvatar
              v-bem="'pair-icon'"
              :symbol="pool.stakeToken.symbol"
            />
            <div v-bem="'pair-name'">
              {{ pool.stakeToken.symbol }}
            </div>
          </div>
          <div
            v-if="operation === ModalOperation.Stake"
            v-bem="'balance'"
          >
            Balance: {{ formattedBalance }}
          </div>
          <div
            v-if="operation === ModalOperation.Unstake"
            v-bem="'staked'"
          >
            Staked: {{ formattedStaked }}
          </div>
        </div>
      </div>
      <div v-bem="'percents'">
        <KlayButton
          v-for="percent in [10, 25, 50, 75]"
          :key="percent"
          v-bem="'percent'"
          size="sm"
          @click="setPercent(percent)"
        >
          {{ percent }}%
        </KlayButton>
        <KlayButton
          v-bem="'percent'"
          type="primary"
          size="sm"
          @click="setPercent(100)"
        >
          MAX
        </KlayButton>
      </div>
      <div v-bem="'row'">
        <KlayButton
          v-bem="'confirm'"
          type="primary"
          size="lg"
          :disabled="disabled"
          :loading="loading"
          @click="confirm"
        >
          Confirm
        </KlayButton>
      </div>
    </KlayModalCard>
  </SModal>
</template>

<style lang="sass">
@import '@/styles/vars.sass'

.module-staking-stake-modal
  &__row
    & + &
      margin-top: 16px
  &__input
    &-wrapper
      position: relative
    .s-text-field__input-wrapper
      height: 88px
      input
        padding: 16px 92px 33px 16px
        font-size: 30px
        font-weight: 600
        line-height: 39px
  &__info
    position: absolute
    display: flex
    align-items: center
    height: 39px
    top: 16px
    right: 16px
  &__percents
    display: flex
    margin: 8px 0 24px
  &__percent
    flex: 1
    font-size: 12px
    font-weight: 700
    & + &
      margin-left: 16px
  &__pair
    position: absolute
    display: flex
    align-items: center
    height: 39px
    top: 16px
    right: 16px
    &-name
      margin-left: 8px
      font-size: 14px
      font-weight: 600
  &__staked, &__balance
    position: absolute
    right: 16px
    bottom: 8px
    font-size: 12px
    line-height: 14px
    font-weight: 400
    color: $gray2
  &__confirm
    width: 100%
</style>
