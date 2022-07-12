<script setup lang="ts" name="ModuleFarmingPool">
import { Status } from '@soramitsu-ui/ui'
import { RouteName } from '@/types'
import { FARMING } from '@/core/kaikas/smartcontracts/abi'
import { ModalOperation, Pool } from './types'
import { FORMATTED_BIG_INT_DECIMALS, FARMING_CONTRACT_ADDRESS } from './const'
import { Farming } from '@/types/typechain/farming'
import BigNumber from 'bignumber.js'
import { useTask, wheneverTaskErrors, wheneverTaskSucceeds } from '@vue-kakuyaku/core'
import { useEnableState } from '../ModuleFarmingStakingShared/composable.check-enabled'

const kaikasStore = useKaikasStore()

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
const modalOperation = ref<ModalOperation | null>(null)

const modelOpen = computed({
  get() {
    return !!modalOperation.value
  },
  set(value) {
    if (!value) modalOperation.value = null
  },
})

const tokenSymbols = computed(() => {
  return pool.value.name.split('-')
})

const formattedStaked = computed(() => {
  return new BigNumber(pool.value.staked.toFixed(FORMATTED_BIG_INT_DECIMALS))
})

const formattedEarned = computed(() => {
  return new BigNumber(pool.value.earned.toFixed(FORMATTED_BIG_INT_DECIMALS))
})

const formattedAnnualPercentageRate = computed(() => {
  return '%' + new BigNumber(pool.value.annualPercentageRate.toFixed(FORMATTED_BIG_INT_DECIMALS))
})

const formattedLiquidity = computed(() => {
  return '$' + new BigNumber(pool.value.liquidity.toFixed(0))
})

const formattedMultiplier = computed(() => {
  return 'x' + new BigNumber(pool.value.multiplier.toFixed(FORMATTED_BIG_INT_DECIMALS))
})

const stats = computed(() => {
  return {
    earned: formattedEarned.value,
    annualPercentageRate: formattedAnnualPercentageRate.value,
    liquidity: formattedLiquidity.value,
    multiplier: formattedMultiplier.value,
  }
})

function goToLiquidityAddPage(pairId: Pool['pairId']) {
  router.push({ name: RouteName.LiquidityAdd, params: { id: pairId } })
}

const {
  pending: checkEnabledInProgress,
  check: triggerCheckEnabled,
  enable,
  enabled,
} = useEnableState(
  computed(() => pool.value.pairId),
  FARMING_CONTRACT_ADDRESS,
)
whenever(expanded, triggerCheckEnabled)

const loading = computed(() => {
  // FIXME include "enableTask" pending here too?
  return checkEnabledInProgress.value
})

function stake() {
  modalOperation.value = ModalOperation.Stake
}

function unstake() {
  modalOperation.value = ModalOperation.Unstake
}

const withdrawTask = useTask(async () => {
  const kaikas = kaikasStore.getKaikasAnyway()

  const FarmingContract = kaikas.cfg.createContract<Farming>(
    // FIXME wtf?
    props.pool.id,
    FARMING,
  )

  const earned = pool.value.earned
  const gasPrice = await kaikas.cfg.getGasPrice()
  const withdraw = FarmingContract.methods.withdraw(props.pool.id, 0)
  const estimateGas = await withdraw.estimateGas({
    from: kaikas.selfAddress,
    gasPrice,
  })
  await withdraw.send({
    from: kaikas.selfAddress,
    gas: estimateGas,
    gasPrice,
  })

  return { earned }
})
useTaskLog(withdrawTask, 'farming-pool-withdraw')
wheneverTaskSucceeds(withdrawTask, ({ earned }) => {
  emit('withdrawn')
  $notify({ status: Status.Success, description: `${earned} DEX tokens were withdrawn` })
})
wheneverTaskErrors(withdrawTask, () => {
  $notify({ status: Status.Error, description: 'Withdraw DEX tokens error' })
})
const withdraw = () => withdrawTask.run()

function handleStaked(amount: string) {
  modalOperation.value = null
  emit('staked', amount)
}

function handleUnstaked(amount: string) {
  modalOperation.value = null
  emit('unstaked', amount)
}

function handleModalClose() {
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
          <KlayCharAvatar
            v-for="(symbol, index) in tokenSymbols"
            :key="index"
            v-bem="'icon'"
            :symbol="symbol"
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
            {{ t(`ModuleFarmingPool.stats.${label}`) }}
          </div>
          <div v-bem="'stats-item-value'">
            {{ value }}
            <IconKlayCalculator
              v-if="label === 'annualPercentageRate'"
              v-bem="'stats-item-calculator'"
            />
          </div>
        </div>
      </div>
    </template>
    <template v-if="!loading">
      <div v-bem="'first-row'">
        <KlayButton
          v-if="!enabled"
          v-bem="'enable'"
          type="primary"
          @click="enable()"
        >
          Enable {{ pool.name }} balance
        </KlayButton>
        <div
          v-if="enabled"
          v-bem="'staked-input-wrapper'"
        >
          <KlayTextField
            v-bem="'staked-input'"
            :model-value="formattedStaked"
            disabled
          />
          <div v-bem="'staked-input-label'">
            Staked LP Tokes
          </div>
          <div v-bem="'staked-input-buttons'">
            <KlayButton
              v-bem="'unstake'"
              @click="unstake()"
            >
              -
            </KlayButton>
            <KlayButton
              v-bem="'stake-additional'"
              @click="stake()"
            >
              +
            </KlayButton>
          </div>
        </div>
        <div
          v-if="enabled"
          v-bem="'earned-input-wrapper'"
        >
          <KlayTextField
            v-bem="'earned-input'"
            :model-value="formattedEarned"
            disabled
          />
          <div v-bem="'earned-input-label'">
            Earned DEX Tokens
          </div>
          <div v-bem="'earned-input-buttons'">
            <KlayButton
              v-bem="'withdraw'"
              @click="withdraw()"
            >
              Withdraw
            </KlayButton>
          </div>
        </div>
        <KlayButton
          v-bem="'get-lp'"
          @click="goToLiquidityAddPage(pool.pairId)"
        >
          Get {{ pool.name }} LP
        </KlayButton>
      </div>
      <div v-bem="'links'">
        <a
          v-bem="'link'"
          target="_blank"
          :href="`https://baobab.klaytnfinder.io/account/${FARMING_CONTRACT_ADDRESS}`"
        >
          View Contract
          <IconKlayLink v-bem="'link-icon'" />
        </a>
        <a
          v-bem="'link'"
          target="_blank"
          :href="`https://baobab.klaytnfinder.io/account/${pool.pairId}?tabId=tokenBalance`"
        >
          See Pair Info
          <IconKlayLink v-bem="'link-icon'" />
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

  <ModuleFarmingModal
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

.module-farming-pool
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
    margin-bottom: 12px
    &-label
      font-weight: 500
      font-size: 12px
      line-height: 14px
      color: $gray2
    &-value
      display: flex
      align-items: center
      font-size: 16px
      line-height: 19px
      margin-top: 4px
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
