<script setup lang="ts" name="StakingModuleStakeModal">
import { STextField, SButton, Status } from '@soramitsu-ui/ui'
import { AbiItem } from 'caver-js'

import {
  ModalOperation,
  Pool
} from './types'
import {
  formattedBigIntDecimals
} from './const'

import stakingAbi from '@/utils/smartcontracts/staking.json'
import { useConfigWithConnectedKaikas } from '@/utils/kaikas/config'
import { StakingInitializable } from '@/types/typechain/farming/StakingFactoryPool.sol'
import BigNumber from 'bignumber.js'
import kip7 from '@/utils/smartcontracts/kip-7.json'
import { KIP7 } from '@/types/typechain/tokens'
import { fromWei, toWei } from './utils'
  
const { caver } = window
const config = useConfigWithConnectedKaikas()
const vBem = useBemClass()
const { t } = useI18n()

const props = defineProps<{
  modelValue: boolean
  pool: Pool
  operation: ModalOperation
}>()
const { pool, operation } = toRefs(props)
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (e: 'staked' | 'unstaked', value: string): void
}>()

const model = ref(props.modelValue)
watch(
  () => props.modelValue,
  (origin) => {
    model.value = origin
  },
)
watch(model, (dep) => {
  if (dep !== props.modelValue) {
    emit('update:modelValue', dep)
  }
})

const PoolContract = config.createContract<StakingInitializable>(pool.value.id, stakingAbi.abi as AbiItem[])

const value = ref('0')
const balance = ref<BigNumber | null>(null)
const loading = ref(false)

watch(model, async () => {
  if (model.value) {
    const contract = config.createContract<KIP7>(pool.value.stakeToken.id, kip7.abi as AbiItem[])
    const balanceInWei = await contract.methods.balanceOf(config.address).call()
    balance.value = fromWei(balanceInWei, pool.value.stakeToken.decimals)
  }
})

const formattedStaked = computed(() => {
  return $kaikas.bigNumber(pool.value.staked.toFixed(formattedBigIntDecimals))
})

const formattedBalance = computed(() => {
  if (balance.value === null)
    return ''

  return $kaikas.bigNumber(balance.value.toFixed(formattedBigIntDecimals))
})

const label = computed(() => {
  if (operation.value === ModalOperation.Stake) {
    return t('StakingModuleModal.stakeTitle')
  } else {
    return t('StakingModuleModal.unstakeTitle', { symbol: pool.value.stakeToken.symbol })
  }
})

const notEnough = computed(() => {
  if (balance.value === null)
    return false

  if (operation.value === ModalOperation.Stake)
    return $kaikas.bigNumber(value.value).comparedTo(balance.value) === 1
  else
    return $kaikas.bigNumber(value.value).comparedTo(pool.value.staked) === 1
})

const lessThanOrEqualToZero = computed(() => {
  return $kaikas.bigNumber(value.value).comparedTo(0) !== 1
})

const disabled = computed(() => {
  return notEnough.value || lessThanOrEqualToZero.value
})

function setPercent(percent: number) {
  if (operation.value === ModalOperation.Stake)
    value.value = `${balance.value?.multipliedBy(percent * 0.01)}`
  else
    value.value = `${pool.value.staked.multipliedBy(percent * 0.01)}`
}

async function stake() {
  try {
    loading.value = true
    const amount = value.value
    const gasPrice = await caver.klay.getGasPrice()
    const deposit = PoolContract.methods.deposit(toWei(amount))
    const estimateGas = await deposit.estimateGas({
      from: config.address,
      gasPrice,
    })
    const receipt = await deposit.send({
      from: config.address,
      gas: estimateGas,
      gasPrice
    })
    if (receipt.status === false)
      throw new Error('Transaction error')

    $notify({ status: Status.Success, description: `${amount} ${pool.value.stakeToken.symbol} tokens were staked` })
    emit('staked', amount)
  } catch (e) {
    console.error(e)
    $notify({ status: Status.Error, description: `Stake ${pool.value.stakeToken.symbol} tokens error` })
    throw new Error('Error')
  } finally {
    loading.value = false
  }
}

async function unstake() {
  try {
    loading.value = true
    const amount = value.value
    const gasPrice = await caver.klay.getGasPrice()
    const withdraw = PoolContract.methods.withdraw(toWei(amount, pool.value.stakeToken.decimals))
    const estimateGas = await withdraw.estimateGas({
      from: config.address,
      gasPrice,
    })
    await withdraw.send({
      from: config.address,
      gas: estimateGas,
      gasPrice
    })
    $notify({ status: Status.Success, description: `${amount} ${pool.value.stakeToken.symbol} tokens were unstaked` })
    emit('unstaked', amount)
  } catch (e) {
    console.error(e)
    $notify({ status: Status.Error, description: `Unstake ${pool.value.stakeToken.symbol} tokens error` })
    throw new Error('Error')
  } finally {
    loading.value = false
  }
}

async function confirm() {
  switch(operation.value) {
    case ModalOperation.Stake:
      stake(); break
    case ModalOperation.Unstake:
      unstake(); break
  }
}
</script>

<template>
  <KlayModal
    v-model="model"
    width="420"
    :label="label"
  >
    <div v-bem="'row'">
      <div v-bem="'input-wrapper'">
        <STextField
          v-model="value"
          v-bem="'input'"
        />
        <div v-bem="'info'">
          <KlayIcon
            v-bem="'pair-icon'"
            :symbol="pool.stakeToken.symbol"
            name="empty-token"
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
      <SButton
        v-for="percent in [10, 25, 50, 75]"
        :key="percent"
        v-bem="'percent'"
        size="sm"
        @click="setPercent(percent)"
      >
        {{ percent }}%
      </SButton>
      <SButton
        v-bem="'percent'"
        type="primary"
        size="sm"
        @click="setPercent(100)"
      >
        MAX
      </SButton>
    </div>
    <div v-bem="'row'">
      <SButton
        v-bem="'confirm'"
        type="primary"
        size="lg"
        :disabled="disabled"
        :loading="loading"
        @click="confirm"
      >
        Confirm
      </SButton>
    </div>
  </KlayModal>
</template>

<style lang="sass">
@import '@/styles/vars.sass'

.staking-module-stake-modal
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
