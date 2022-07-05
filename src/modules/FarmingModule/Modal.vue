<script setup lang="ts" name="FarmingModuleModal">
import { STextField, SButton, Status } from '@soramitsu-ui/ui'

import farmingAbi from '@/utils/smartcontracts/farming.json'
import { Farming } from '@/types/typechain/farming'
import { AbiItem } from 'caver-js'
import { FilledPool, LiquidityPosition } from '@/pages/farms/types'
import kip7 from '@/utils/smartcontracts/kip-7.json'
import { useConfigWithConnectedKaikas } from '@/utils/kaikas/config'
  
const { caver } = window

const config = useConfigWithConnectedKaikas()

const vBem = useBemClass()

const props = defineProps<{
  pool: FilledPool
  liquidityPosition: LiquidityPosition
}>()
const emit = defineEmits(['close'])

const farmingContractAddress = '0x32bE07FB9dBf294c2e92715F562f7aBA02b7443A'

const FarmingContract = $kaikas.config.createContract<Farming>(farmingContractAddress, farmingAbi.abi as AbiItem[])

const value = ref('0')

const lpBalance = computed(() => {
  return Number(Number(props.liquidityPosition.liquidityTokenBalance).toFixed(6))
})

const staked = computed(() => {
  return props.pool.userInfo.amount
})

function setMax() {
  value.value = props.liquidityPosition.liquidityTokenBalance
}

const label = computed(() => {
  if (Number(staked.value) === 0) {
    return 'Stake LP tokens'
  } else {
    return 'Stake additional LP tokens'
  }
})

async function confirm() {
  try {
    const gasPrice = await caver.klay.getGasPrice()
    await config.approveAmount(props.pool.pair.id, kip7.abi as AbiItem[], value.value, farmingContractAddress)
    const deposit = FarmingContract.methods.deposit(props.pool.id, Number(value.value) * Math.pow(10, 18))
    const estimateGas = await deposit.estimateGas({
      from: config.address,
      gasPrice,
    })
    await deposit.send({
      from: config.address,
      gas: estimateGas,
      gasPrice
    })
    $notify({ status: Status.Success, description: `${value.value} LP tokens were succesfully staked` })
    emit('close')
  } catch (e) {
    console.error(e)
    $notify({ status: Status.Error, description: 'Stake LP tokens error' })
    throw new Error('Error')
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
                v-for="(char, index) in pool.pair.iconChars"
                :key="index"
                v-bem="'pair-icon'"
                :char="char"
                name="empty-token"
              />
            </div>
            <div v-bem="'pair-name'">
              {{ pool.pair.name }}
            </div>
          </div>
          <div v-bem="'balance'">
            Balance: {{ lpBalance }}
          </div>
        </div>
      </div>
      <div v-bem="'row'">
        <SButton
          v-bem="'confirm'"
          type="primary"
          size="lg"
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

.farming-module-modal
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
  &__balance
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
