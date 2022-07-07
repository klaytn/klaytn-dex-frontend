<script setup lang="ts" name="FarmingModuleStakeModal">
import { STextField, SButton, Status } from '@soramitsu-ui/ui'
import { AbiItem } from 'caver-js'

import {
ModalOperation,
  Pool
} from './types'
import {
  farmingContractAddress,
  formattedBigIntDecimals
} from './const'

import { Farming } from '@/types/typechain/farming'
import farmingAbi from '@/utils/smartcontracts/farming.json'
import { useConfigWithConnectedKaikas } from '@/utils/kaikas/config'
  
const { caver } = window
const config = useConfigWithConnectedKaikas()
const vBem = useBemClass()

const props = defineProps<{
  pool: Pool
  operation: ModalOperation
}>()
const { pool, operation } = toRefs(props)
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'staked' | 'unstaked', value: string): void
}>()

const value = ref('0')
const loading = ref(false)

const iconChars = computed(() => {
  return pool.value.name.split('-').map(tokenName => tokenName[0])
})

const formattedStaked = computed(() => {
  return $kaikas.bigNumber(pool.value.staked.toFixed(formattedBigIntDecimals))
})

const formattedBalance = computed(() => {
  return $kaikas.bigNumber(pool.value.balance.toFixed(formattedBigIntDecimals))
})

const label = computed(() => {
  if (operation.value === ModalOperation.Stake) {
    if (pool.value.staked.comparedTo(0) === 0) {
      return 'Stake LP tokens'
    } else {
      return 'Stake additional LP tokens'
    }
  } else {
    return 'Unstake LP tokens'
  }
})

const notEnough = computed(() => {
  let compareValue = operation.value === ModalOperation.Stake
    ? pool.value.balance
    : pool.value.staked
  return $kaikas.bigNumber(value.value).comparedTo(compareValue) === 1
})

const lessThenZero = computed(() => {
  return $kaikas.bigNumber(value.value).comparedTo(0) === -1
})

const disabled = computed(() => {
  return notEnough.value || lessThenZero.value
})

function setMax() {
  value.value = `${pool.value.balance}`
}

const FarmingContract = $kaikas.config.createContract<Farming>(farmingContractAddress, farmingAbi.abi as AbiItem[])

async function stake() {
  try {
    loading.value = true
    const amount = value.value
    const gasPrice = await caver.klay.getGasPrice()
    const deposit = FarmingContract.methods.deposit(props.pool.id, $kaikas.utils.toWei(amount))
    const estimateGas = await deposit.estimateGas({
      from: config.address,
      gasPrice,
    })
    await deposit.send({
      from: config.address,
      gas: estimateGas,
      gasPrice
    })
    $notify({ status: Status.Success, description: `${amount} LP tokens were staked` })
    emit('staked', amount)
  } catch (e) {
    console.error(e)
    $notify({ status: Status.Error, description: 'Stake LP tokens error' })
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
    const withdraw = FarmingContract.methods.withdraw(props.pool.id, $kaikas.utils.toWei(amount))
    const estimateGas = await withdraw.estimateGas({
      from: config.address,
      gasPrice,
    })
    await withdraw.send({
      from: config.address,
      gas: estimateGas,
      gasPrice
    })
    $notify({ status: Status.Success, description: `${amount} LP tokens were unstaked` })
    emit('unstaked', amount)
  } catch (e) {
    console.error(e)
    $notify({ status: Status.Error, description: 'Unstake LP tokens error' })
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
    padding="20px 0"
    width="420"
    :label="label"
    @close="emit('close')"
  >
    <div v-bem="'content'">
      <div v-bem="'row'">
        <div v-bem="'input-wrapper'">
          <STextField
            v-model="value"
            v-bem="'input'"
          />
          <div v-bem="'info'">
            <SButton
              v-bem="'max'"
              type="primary"
              size="xs"
              @click="setMax"
            >
              MAX
            </SButton>
            <div v-bem="'pair-icons'">
              <KlayIcon
                v-for="(char, index) in iconChars"
                :key="index"
                v-bem="'pair-icon'"
                :char="char"
                name="empty-token"
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
    </div>
  </KlayModal>
</template>

<style lang="sass">
@import '@/styles/vars.sass'

.farming-module-stake-modal
  &__content
    display: flex
    flex-direction: column
    margin: 8px 16px
  &__row
    margin: 8px 0
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
