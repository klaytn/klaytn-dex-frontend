<script setup lang="ts" name="ModuleStakingPool">
import { STextField, SButton, Status } from '@soramitsu-ui/ui'

import { ModalOperation, Pool } from './types'
import { FORMATTED_BIG_INT_DECIMALS } from './const'
import { StakingInitializable } from '@/types/typechain/farming/StakingFactoryPool.sol'
import { RouteName } from '@/types'
import BigNumber from 'bignumber.js'
import { useEnableState } from '../ModuleFarmingStakingShared/composable.check-enabled'
import { useTask, wheneverTaskSucceeds, wheneverTaskErrors } from '@vue-kakuyaku/core'
import { STAKING } from '@/core/kaikas/smartcontracts/abi'

const kaikas = useKaikasStore().getKaikasAnyway()

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

const PoolContract = kaikas.cfg.createContract<StakingInitializable>(pool.value.id, STAKING)

const stakingStore = useStakingStore()

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

const formattedEarned = computed(() => {
  return new BigNumber(pool.value.earned.toFixed(FORMATTED_BIG_INT_DECIMALS))
})

const formattedStaked = computed(() => {
  return new BigNumber(pool.value.staked.toFixed(FORMATTED_BIG_INT_DECIMALS))
})

const formattedTotalStaked = computed(() => {
  return new BigNumber(pool.value.totalStaked.toFixed(FORMATTED_BIG_INT_DECIMALS))
})

const formattedAnnualPercentageRate = computed(() => {
  return '%' + new BigNumber(pool.value.annualPercentageRate.toFixed(FORMATTED_BIG_INT_DECIMALS))
})

const formattedEndsIn = computed(() => {
  return pool.value.endsIn > 0
    ? t('ModuleStakingPool.endsIn', { blocks: pool.value.endsIn.toLocaleString('en-US') })
    : '—'
})

const stats = computed(() => {
  return {
    earned: formattedEarned.value,
    totalStaked: formattedTotalStaked.value,
    annualPercentageRate: formattedAnnualPercentageRate.value,
    endsIn: formattedEndsIn.value,
  }
})

const {
  pending: loading,
  check: triggerCheckEnabled,
  enable,
  enabled,
} = useEnableState(
  computed(() => pool.value.stakeToken.id),
  computed(() => pool.value.id),
)
whenever(expanded, triggerCheckEnabled)

function stake() {
  modalOperation.value = ModalOperation.Stake
}

function unstake() {
  modalOperation.value = ModalOperation.Unstake
}

function addToKaikas(pool: Pool) {
  stakingStore.addTokenToKaikas({
    address: pool.rewardToken.id,
    symbol: pool.rewardToken.symbol,
    decimals: pool.rewardToken.decimals,
  })
}

function goToSwapPage() {
  router.push({ name: RouteName.Swap })
}

const withdrawTask = useTask(async () => {
  const earned = pool.value.earned
  const gasPrice = await kaikas.cfg.caver.klay.getGasPrice()
  const withdraw = PoolContract.methods.withdraw(0)
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
useTaskLog(withdrawTask, 'staking-pool-withdraw')
wheneverTaskSucceeds(withdrawTask, ({ earned }) => {
  emit('withdrawn')
  $notify({ status: Status.Success, description: `${earned} ${pool.value.rewardToken.symbol} tokens were withdrawn` })
})
wheneverTaskErrors(withdrawTask, () => {
  $notify({ status: Status.Error, description: `Withdraw ${pool.value.rewardToken.symbol} tokens error` })
})
const withdraw = () => withdrawTask.run()

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
          <KlayCharAvatar
            v-bem="'icon'"
            :symbol="pool.rewardToken.symbol"
            :lightness="65"
          />
          <KlayCharAvatar
            v-bem="'icon'"
            :symbol="pool.stakeToken.symbol"
            :lightness="75"
          />
        </div>
        <div v-bem="'title'">
          <span v-bem="'title-stake'"> Stake {{ pool.stakeToken.symbol }} </span>
          <span v-bem="'title-earn'"> Earn {{ pool.rewardToken.symbol }} </span>
        </div>
        <div
          v-for="(value, label) in stats"
          :key="label"
          v-bem="'stats-item'"
        >
          <div v-bem="'stats-item-label'">
            {{ t(`ModuleStakingPool.stats.${label}`, { symbol: pool.rewardToken.symbol }) }}
          </div>
          <div v-bem="['stats-item-value', { zero: value == '0' }]">
            {{ value }}
            <IconKlayCalculator
              v-if="label === 'annualPercentageRate'"
              v-bem="'stats-item-calculator'"
            />
            <IconKlayClock
              v-if="label === 'endsIn' && value !== '—'"
              v-bem="'stats-item-clock'"
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
            {{ t('ModuleStakingPool.staked', { symbol: pool.stakeToken.symbol }) }}
          </div>
          <div v-bem="'staked-input-buttons'">
            <SButton
              v-if="!pool.staked.isZero()"
              v-bem="'unstake'"
              @click="unstake()"
            >
              -
            </SButton>
            <SButton
              v-if="!pool.staked.isZero()"
              v-bem="'stake-additional'"
              @click="stake()"
            >
              +
            </SButton>
            <SButton
              v-if="pool.staked.isZero()"
              v-bem="'stake'"
              type="primary"
              @click="stake()"
            >
              Stake {{ pool.stakeToken.symbol }}
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
            {{ t('ModuleStakingPool.earned', { symbol: pool.rewardToken.symbol }) }}
          </div>
          <div v-bem="'earned-input-buttons'">
            <SButton
              v-bem="'withdraw'"
              :disabled="pool.earned.isZero()"
              @click="withdraw()"
            >
              Withdraw
            </SButton>
          </div>
        </div>
        <SButton
          v-if="!enabled"
          v-bem="'get-stake-token'"
          @click="goToSwapPage()"
        >
          Get {{ pool.stakeToken.symbol }}
        </SButton>
      </div>
      <div v-bem="'links'">
        <a
          v-bem="'link'"
          :href="`https://baobab.klaytnfinder.io/account/${pool.stakeToken.id}`"
        >
          See Token Info
          <IconKlayLink v-bem="'link-icon'" />
        </a>
        <a v-bem="'link'">
          View Project Site
          <IconKlayLink v-bem="'link-icon'" />
        </a>
        <a
          v-bem="'link'"
          :href="`https://baobab.klaytnfinder.io/account/${pool.id}`"
        >
          View Contract
          <IconKlayLink v-bem="'link-icon'" />
        </a>
        <a
          v-bem="'link'"
          @click="addToKaikas(pool)"
        >
          Add to Kaikas
          <img
            v-bem="'link-klay-icon'"
            src="/icons/klay.png"
          >
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

  <ModuleStakingModal
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

.module-staking-pool
  &__head
    display: flex
    align-items: center
  &__icons
    display: flex
    align-items: flex-end
  &__icon
    &:first-child
      width: 36px
      height: 36px
    &:last-child
      width: 20px
      height: 20px
      margin-left: -8px
  &__title
    display: flex
    flex-direction: column
    width: 180px
    margin-left: 8px
    margin-bottom: 12px
    font-size: 16px
    &-stake
      font-weight: 500
      font-size: 12px
      line-height: 14px
      color: $gray2
    &-earn
      display: flex
      align-items: center
      font-size: 16px
      line-height: 19px
      margin-top: 4px
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
      &--zero
        color: $gray3
    &-calculator
      margin-left: 5px
      fill: $gray3
    &-clock
      margin-left: 7px
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
  &__stake
    width: 172px
  &__enable
    width: 240px
  &__get-stake-token
    width: 200px
    margin-left: 24px
  &__links
    display: flex
    margin-top: 16px
  &__link
    display: flex
    align-items: center
    font-size: 12px
    cursor: pointer
    & + &
      margin-left: 20px
    &-icon
      margin-left: 5px
      color: $gray3
    &-klay-icon
      width: 20px
      margin-left: 5px
      filter: grayscale(1) contrast(0.3) brightness(1.2)
  &__loader
    display: flex
    justify-content: center
    align-items: center
    height: 82px
</style>
