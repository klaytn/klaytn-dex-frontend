<script setup lang="ts" name="FarmingModulePool">
import { STextField, SButton, Status } from '@soramitsu-ui/ui'

import { RouteName } from '@/types'
import farmingAbi from '@/utils/smartcontracts/farming.json'

import {
ModalOperation,
  Pool
} from './types'
import {
  MAX_UINT256,
  formattedBigIntDecimals,
  farmingContractAddress
} from './const'
import kip7 from '@/utils/smartcontracts/kip-7.json'
import { useConfigWithConnectedKaikas } from '@/utils/kaikas/config'
import { AbiItem } from 'caver-js'
import { Farming } from '@/types/typechain/farming'

const { caver } = window
const config = useConfigWithConnectedKaikas()
const vBem = useBemClass()
const router = useRouter()
const { t } = useI18n()

const props = defineProps<{
  pool: Pool
}>()
const { pool } = toRefs(props)
const emit = defineEmits<{
  (e: 'staked' | 'unstaked', value: string): void
  (e: 'withdrawn'): void
}>()

const expanded = ref(false)
const enabled = ref(false)
const checkEnabledInProgress = ref(false)
const checkEnabledCompleted = ref(false)
const modalOperation = ref<ModalOperation | null>(null)

const iconChars = computed(() => {
  return pool.value.name.split('-').map(tokenName => tokenName[0])
})

const formattedStaked = computed(() => {
  return $kaikas.bigNumber(pool.value.staked.toFixed(formattedBigIntDecimals))
})

const formattedEarned = computed(() => {
  return $kaikas.bigNumber(pool.value.earned.toFixed(formattedBigIntDecimals))
})

const formattedAnnualPercentageRate = computed(() => {
  return '%' + $kaikas.bigNumber(pool.value.annualPercentageRate.toFixed(formattedBigIntDecimals))
})

const formattedLiquidity = computed(() => {
  return '$' + $kaikas.bigNumber(pool.value.liquidity.toFixed(formattedBigIntDecimals))
})

const formattedVolume24H = computed(() => {
  return '$' + $kaikas.bigNumber(pool.value.volume24H.toFixed(formattedBigIntDecimals))
})

const formattedVolume7D = computed(() => {
  return '$' + $kaikas.bigNumber(pool.value.volume7D.toFixed(formattedBigIntDecimals))
})

const stats = computed(() => {
  return {
    earned: formattedEarned.value,
    annualPercentageRate: formattedAnnualPercentageRate.value,
    liquidity: formattedLiquidity.value,
    volume24H: formattedVolume24H.value,
    volume7D: formattedVolume7D.value,
  }
})

function goToLiquidityAddPage (pairId: Pool['pairId']) {
  router.push({ name: RouteName.LiquidityAdd, params: { id: pairId } })
}

async function checkEnabled() {
  if (!enabled.value && !checkEnabledInProgress.value && !checkEnabledCompleted.value) {
    try {
      checkEnabledInProgress.value = true

      const allowance = await config.getAllowance(
        pool.value.pairId,
        kip7.abi as AbiItem[],
        farmingContractAddress
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
      pool.value.pairId,
      kip7.abi as AbiItem[],
      MAX_UINT256.toFixed(),
      farmingContractAddress
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

const FarmingContract = $kaikas.config.createContract<Farming>(farmingContractAddress, farmingAbi.abi as AbiItem[])

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
    const withdraw = FarmingContract.methods.withdraw(props.pool.id, 0)
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
    $notify({ status: Status.Success, description: `${earned} DEX tokens were withdrawn` })
  } catch (e) {
    console.error(e)
    $notify({ status: Status.Error, description: 'Withdraw DEX tokens error' })
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
    v-bem
  >
    <template #title>
      <div v-bem="'head'">
        <div v-bem="'icons'">
          <KlayIcon
            v-for="(char, index) in iconChars"
            :key="index"
            v-bem="'icon'"
            :char="char"
            name="empty-token"
          />
        </div>
        <div v-bem="'name'">
          {{ pool.name }}
        </div>
        <div
          v-for="(value, label) in stats"
          :key="label"
          v-bem="'stats-item'"
        >
          <div v-bem="'stats-item-label'">
            {{ t(`farmsPage.stats.${label}`) }}
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
          Enable {{ pool.name }} balance
        </SButton>
        <div
          v-if="enabled"
          v-bem="'staked-input-wrapper'"
        >
          <STextField
            v-bem="'staked-input'"
            :value="formattedStaked"
            :disabled="true"
          />
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
            :value="formattedEarned"
            :disabled="true"
          />
          <div v-bem="'earned-input-buttons'">
            <SButton
              v-bem="'withdraw'"
              @click="withdraw()"
            >
              Withdraw
            </SButton>
          </div>
        </div>
        <SButton
          v-bem="'get-lp'"
          @click="goToLiquidityAddPage(pool.pairId)"
        >
          Get {{ pool.name }} LP
        </SButton>
      </div>
      <div v-bem="'links'">
        <a
          v-bem="'link'"
          :href="`https://baobab.klaytnfinder.io/account/${farmingContractAddress}`"
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

  <FarmingModuleModal
    v-if="modalOperation"
    :pool="pool"
    :operation="modalOperation"
    @close="handleModalClose"
    @staked="handleStaked"
    @unstaked="handleUnstaked"
  />
</template>

<style lang="sass">
@import '@/styles/vars.sass'

.farming-module-pool
  &__head
    display: flex
    align-items: center
  &__icons
    display: flex
  &__icon:last-child
    margin-left: -9px
  &__name
    width: 130px
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
    &-buttons
      position: absolute
      right: 16px
      top: 16px
  &__earned-input
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
    &-icon
      margin-left: 5px
      color: $gray3
  &__loader
    display: flex
    justify-content: center
    align-items: center
    height: 82px
</style>
