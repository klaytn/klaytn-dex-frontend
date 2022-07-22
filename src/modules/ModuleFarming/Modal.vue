<script setup lang="ts" name="ModuleFarmingStakeModal">
import { Status, SModal } from '@soramitsu-ui/ui'
import { ModalOperation, Pool } from './types'
import { FARMING_CONTRACT_ADDRESS, FORMATTED_BIG_INT_DECIMALS } from './const'
import BigNumber from 'bignumber.js'
import { Farming } from '@/types/typechain/farming'
import { FARMING } from '@/core/kaikas/smartcontracts/abi'
import { useTask, wheneverTaskSucceeds } from '@vue-kakuyaku/core'
import invariant from 'tiny-invariant'
import { farmingToWei } from './utils'

const kaikasStore = useKaikasStore()

const FarmingContract = computed(() =>
  kaikasStore.kaikas?.cfg.createContract<Farming>(FARMING_CONTRACT_ADDRESS, FARMING),
)
const contractAnyway = () => {
  const item = FarmingContract.value
  invariant(item)
  return item
}

const vBem = useBemClass()

const props = defineProps<{
  modelValue: boolean
  pool: Pool
  operation: ModalOperation
}>()
const { pool, operation } = toRefs(props)
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'staked' | 'unstaked', value: string): void
}>()

const show = useVModel(props, 'modelValue', emit)
const value = ref('0')

watch(show, () => {
  value.value = '0'
})

const iconChars = computed(() => {
  return pool.value.name.split('-')
})

const formattedStaked = computed(() => {
  return new BigNumber(pool.value.staked.toFixed(FORMATTED_BIG_INT_DECIMALS))
})

const formattedBalance = computed(() => {
  return new BigNumber(pool.value.balance.toFixed(FORMATTED_BIG_INT_DECIMALS))
})

const label = computed(() => {
  if (operation.value === ModalOperation.Stake) {
    if (pool.value.staked.isZero()) {
      return 'Stake LP tokens'
    } else {
      return 'Stake additional LP tokens'
    }
  } else {
    return 'Unstake LP tokens'
  }
})

const notEnough = computed(() => {
  let compareValue = operation.value === ModalOperation.Stake ? pool.value.balance : pool.value.staked
  return new BigNumber(value.value).isGreaterThan(compareValue)
})

const lessThanOrEqualToZero = computed(() => {
  return new BigNumber(value.value).isLessThanOrEqualTo(0)
})

const disabled = computed(() => {
  return notEnough.value || lessThanOrEqualToZero.value
})

function setMax() {
  if (operation.value === ModalOperation.Stake) value.value = `${pool.value.balance}`
  else value.value = `${pool.value.staked}`
}

const stakeTask = useTask(async () => {
  const kaikas = kaikasStore.getKaikasAnyway()
  const FarmingContract = contractAnyway()

  const amount = value.value
  const gasPrice = await kaikas.cfg.getGasPrice()
  const deposit = FarmingContract.methods.deposit(props.pool.id, farmingToWei(amount))
  const estimateGas = await deposit.estimateGas({
    from: kaikas.selfAddress,
    gasPrice,
  })
  const receipt = await deposit.send({
    from: kaikas.selfAddress,
    gas: estimateGas,
    gasPrice,
  })
  if (receipt.status === false) throw new Error('Transaction error')

  return { amount }
})
wheneverTaskSucceeds(stakeTask, ({ amount }) => {
  $notify({ status: Status.Success, description: `${amount} LP tokens were staked` })
  emit('staked', amount)
})
useNotifyOnError(stakeTask, 'Stake LP tokens error')
const stake = () => stakeTask.run()

const unstakeTask = useTask(async () => {
  const kaikas = kaikasStore.getKaikasAnyway()
  const FarmingContract = contractAnyway()

  const amount = value.value
  const gasPrice = await kaikas.cfg.getGasPrice()
  const withdraw = FarmingContract.methods.withdraw(props.pool.id, farmingToWei(amount))
  const estimateGas = await withdraw.estimateGas({
    from: kaikas.selfAddress,
    gasPrice,
  })
  await withdraw.send({
    from: kaikas.selfAddress,
    gas: estimateGas,
    gasPrice,
  })

  return { amount }
})
wheneverTaskSucceeds(unstakeTask, ({ amount }) => {
  $notify({ status: Status.Success, description: `${amount} LP tokens were unstaked` })
  emit('unstaked', amount)
})
useNotifyOnError(unstakeTask, 'Unstake LP tokens error')
const unstake = () => unstakeTask.run()

const loading = computed(() => stakeTask.state.kind === 'pending' || unstakeTask.state.kind === 'pending')

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
  <SModal v-model:show="show">
    <KlayModalCard
      class="w-[420px]"
      :title="label"
    >
      <div v-bem="'row'">
        <div v-bem="'input-wrapper'">
          <KlayTextField
            v-model="value"
            v-bem="'input'"
          />
          <div v-bem="'info'">
            <KlayButton
              v-bem="'max'"
              type="primary"
              size="xs"
              @click="setMax"
            >
              MAX
            </KlayButton>
            <div v-bem="'pair-icons'">
              <KlayCharAvatar
                v-for="(char, index) in iconChars"
                :key="index"
                v-bem="'pair-icon'"
                :symbol="char"
              />
            </div>
            <div v-bem="'pair-name'">
              {{ pool.name }}
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

.module-farming-stake-modal
  &__row
    & + &
      margin-top: 16px
  &__input
    &-wrapper
      position: relative
    .s-text-field__input-wrapper
      height: 88px
      input
        padding: 16px 50% 33px 16px
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
  &__max
    font-size: 10px
    font-weight: 700
  &__pair
    position: absolute
    display: flex
    align-items: center
    height: 39px
    top: 16px
    right: 16px
    &-icons
      display: flex
      margin-left: 8px
    &-icon:last-child
      margin-left: -9px
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
