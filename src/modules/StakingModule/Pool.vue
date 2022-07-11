<script setup lang="ts" name="StakingModulePool">
import { STextField, SButton, Status } from '@soramitsu-ui/ui'

import {
ModalOperation,
  Pool
} from './types'
import {
  MAX_UINT256,
  formattedBigIntDecimals
} from './const'
import kip7 from '@/utils/smartcontracts/kip-7.json'
import stakingAbi from '@/utils/smartcontracts/staking.json'
import { useConfigWithConnectedKaikas } from '@/utils/kaikas/config'
import { AbiItem } from 'caver-js'
import { StakingInitializable } from '@/types/typechain/farming/StakingFactoryPool.sol'

const { caver } = window
const config = useConfigWithConnectedKaikas()
const vBem = useBemClass()
const { t } = useI18n()

const props = defineProps<{
  pool: Pool
}>()
const { pool } = toRefs(props)
const emit = defineEmits<{
  (e: 'staked' | 'unstaked', value: string): void
  (e: 'withdrawn'): void
}>()

const PoolContract = $kaikas.config.createContract<StakingInitializable>(pool.value.id, stakingAbi.abi as AbiItem[])

const expanded = ref(false)
const enabled = ref(false)
const checkEnabledInProgress = ref(false)
const checkEnabledCompleted = ref(false)
const modalOperation = ref<ModalOperation | null>(null)

const modelOpen = computed({
  get() {
    return !!modalOperation.value
  },
  set(value) {
    if (!value)
      modalOperation.value = null
  }
})

const formattedEarned = computed(() => {
  return $kaikas.bigNumber(pool.value.earned.toFixed(formattedBigIntDecimals))
})

const formattedStaked = computed(() => {
  return $kaikas.bigNumber(pool.value.staked.toFixed(formattedBigIntDecimals))
})

const formattedTotalStaked = computed(() => {
  return $kaikas.bigNumber(pool.value.totalStaked.toFixed(formattedBigIntDecimals))
})

const formattedAnnualPercentageRate = computed(() => {
  return '%' + $kaikas.bigNumber(pool.value.annualPercentageRate.toFixed(formattedBigIntDecimals))
})

const formattedEndsIn = computed(() => {
  return pool.value.endsIn > 0 ? t('StakingModulePool.endsIn', { blocks: pool.value.endsIn.toLocaleString('en-US') }) : '—'
})

const stats = computed(() => {
  return {
    earned: formattedEarned.value,
    totalStaked: formattedTotalStaked.value,
    annualPercentageRate: formattedAnnualPercentageRate.value,
    endsIn: formattedEndsIn.value,
  }
})

async function checkEnabled() {
  if (!enabled.value && !checkEnabledInProgress.value && !checkEnabledCompleted.value) {
    try {
      checkEnabledInProgress.value = true

      const allowance = await config.getAllowance(
        pool.value.stakeToken.id,
        kip7.abi as AbiItem[],
        pool.value.id
      )

      enabled.value = $kaikas.bigNumber(allowance).isEqualTo(MAX_UINT256)

      checkEnabledInProgress.value = false
      checkEnabledCompleted.value = true
    } catch (e) {
      console.error(e)
      $notify({ status: Status.Error, description: 'Fetch enabled pools error' })
      throw new Error('Error')
    }
  }
}

async function enable() {
  try {
    await config.approveAmount(
      pool.value.stakeToken.id,
      kip7.abi as AbiItem[],
      MAX_UINT256.toFixed(),
      pool.value.id
    )

    enabled.value = true
  } catch (e) {
    console.error(e)
    $notify({ status: Status.Error, description: 'Approve amount error' })
    throw new Error('Error')
  }
}

watch(expanded, (value) => {
  if (value)
    checkEnabled()
})

const loading = computed(() => {
  return checkEnabledInProgress.value
})

function stake() {
  modalOperation.value = ModalOperation.Stake
}

function unstake() {
  modalOperation.value = ModalOperation.Unstake
}

async function withdraw() {
  try {
    const earned = pool.value.earned
    const gasPrice = await caver.klay.getGasPrice()
    const withdraw = PoolContract.methods.withdraw(0)
    const estimateGas = await withdraw.estimateGas({
      from: config.address,
      gasPrice,
    })
    await withdraw.send({
      from: config.address,
      gas: estimateGas,
      gasPrice
    })
    emit('withdrawn')
    $notify({ status: Status.Success, description: `${earned} ${pool.value.rewardToken.symbol} tokens were withdrawn` })
  } catch (e) {
    console.error(e)
    $notify({ status: Status.Error, description: `Withdraw ${pool.value.rewardToken.symbol} tokens error` })
    throw new Error('Error')
  }
}

async function handleStaked(amount: string) {
  modalOperation.value = null
  emit('staked', amount)
}

async function handleUnstaked(amount: string) {
  modalOperation.value = null
  emit('unstaked', amount)
}

async function handleModalClose() {
  modalOperation.value = null
}
</script>

<template>
  <KlayAccordionItem
    v-model="expanded"
    v-bem="{ enabled }"
  >
    <template #title>
      <div v-bem="'head'">
        <div v-bem="'icons'">
          <!-- <KlayIcon
            v-for="(char, index) in iconChars"
            :key="index"
            v-bem="'icon'"
            :char="char"
            name="empty-token"
          /> -->
        </div>
        <!-- <div v-bem="'name'">
          {{ pool.name }}
        </div> -->
        <div
          v-for="(value, label) in stats"
          :key="label"
          v-bem="'stats-item'"
        >
          <div v-bem="'stats-item-label'">
            {{ t(`StakingModulePool.stats.${label}`, { symbol: pool.rewardToken.symbol }) }}
          </div>
          <div v-bem="'stats-item-value'">
            {{ value }}
            <KlayIcon
              v-if="label === 'annualPercentageRate'"
              v-bem="'stats-item-calculator'"
              name="calculator"
            />
          </div>
        </div>
      </div>
    </template>
    <template v-if="!loading">
      <div v-bem="'first-row'">
        <SButton
          v-if="!enabled"
          v-bem="'enable'"
          type="primary"
          @click="enable()"
        >
          Enable {{ pool.stakeToken.symbol }}
        </SButton>
        <div
          v-if="enabled"
          v-bem="'staked-input-wrapper'"
        >
          <STextField
            v-bem="'staked-input'"
            :model-value="formattedStaked"
            :disabled="true"
          />
          <div v-bem="'staked-input-label'">
            {{ t('StakingModulePool.staked', { symbol: pool.stakeToken.symbol }) }}
          </div>
          <div v-bem="'staked-input-buttons'">
            <SButton
              v-bem="'unstake'"
              @click="unstake()"
            >
              -
            </SButton>
            <SButton
              v-bem="'stake-additional'"
              @click="stake()"
            >
              +
            </SButton>
          </div>
        </div>
        <div
          v-if="enabled"
          v-bem="'earned-input-wrapper'"
        >
          <STextField
            v-bem="'earned-input'"
            :model-value="formattedEarned"
            :disabled="true"
          />
          <div v-bem="'earned-input-label'">
            {{ t('StakingModulePool.earned', { symbol: pool.rewardToken.symbol }) }}
          </div>
          <div v-bem="'earned-input-buttons'">
            <SButton
              v-bem="'withdraw'"
              @click="withdraw()"
            >
              Withdraw
            </SButton>
          </div>
        </div>
      </div>
      <div v-bem="'links'">
        <a
          v-bem="'link'"
          :href="`https://baobab.klaytnfinder.io/account/${pool.stakeToken.id}`"
        >
          See Token Info
          <KlayIcon
            v-bem="'link-icon'"
            name="link"
          />
        </a>
        <a
          v-bem="'link'"
        >
          View Project Site
          <KlayIcon
            v-bem="'link-icon'"
            name="link"
          />
        </a>
        <a
          v-bem="'link'"
          :href="`https://baobab.klaytnfinder.io/account/${pool.id}`"
        >
          View Contract
          <KlayIcon
            v-bem="'link-icon'"
            name="link"
          />
        </a>
      </div>
    </template>
    <div
      v-if="loading"
      v-bem="'loader'"
    >
      <KlayLoader />
    </div>
  </KlayAccordionItem>

  <StakingModuleModal
    v-model="modelOpen"
    :pool="pool"
    :operation="modalOperation"
    @update:mode="handleModalClose"
    @staked="handleStaked"
    @unstaked="handleUnstaked"
  />
</template>

<style lang="sass">
@import '@/styles/vars.sass'

.staking-module-pool
  &__head
    display: flex
    align-items: center
  &__icons
    display: flex
  &__icon:last-child
    margin-left: -9px
  &__name
    width: 180px
    margin-left: 8px
    font-size: 16px
  &__stats-item
    display: flex
    flex-direction: column
    flex: 1
    &-label
      font-weight: 500
      font-size: 12px
      color: $gray2
    &-value
      display: flex
      align-items: center
      font-size: 16px
    &-calculator
      margin-left: 5px
      fill: $gray3
  &__first-row
    display: flex
    align-items: center
  &--enabled &__first-row
    margin-top: 24px
  &__staked-input, &__earned-input
    width: 388px
    &-wrapper
      position: relative
    .s-text-field__input-wrapper
      height: 72px
      input
        padding: 16px 120px 33px 16px
        font-size: 30px
        font-weight: 600
        line-height: 39px
    &-label
      position: absolute
      bottom: 80px
      font-size: 12px
      line-height: 14px
    &-buttons
      position: absolute
      right: 16px
      top: 16px
  &__earned-input-wrapper
    margin-left: 24px
  &__unstake, &__stake-additional
    margin-left: 8px
  &__enable
    width: 240px
  &__get-lp
    width: 200px
    margin-left: 24px
  &__links
    display: flex
    margin-top: 16px
  &__link
    display: flex
    align-items: center
    font-size: 12px
    & + &
      margin-left: 20px
    &-icon
      margin-left: 5px
      color: $gray3
  &__loader
    display: flex
    justify-content: center
    align-items: center
    height: 82px
</style>
