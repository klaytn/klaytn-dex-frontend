<script setup lang="ts" name="ModuleStakingPool">
import { KlayIconCalculator, KlayIconClock, KlayIconLink } from '~klay-icons'
import { ModalOperation, Pool } from './types'
import { FORMATTED_BIG_INT_DECIMALS } from './const'
import { RouteName, RoiType } from '@/types'
import BigNumber from 'bignumber.js'
import { useEnableState } from '../ModuleEarnShared/composable.check-enabled'
import { Wei } from '@/core'

const dexStore = useDexStore()
const { notify } = useNotify()

const vBem = useBemClass()
const router = useRouter()
const { t } = useI18n()
const showRoiCalculator = ref(false)
const roiType = RoiType.Staking
const roiPool = ref<Pool | null>(null)

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

const modalOpen = computed({
  get() {
    return !!modalOperation.value
  },
  set(value) {
    if (!value) modalOperation.value = null
  },
})

const balanceScope = useParamScope(
  computed(() => {
    const activeDex = dexStore.active
    return (
      activeDex.kind === 'named' &&
      (unref(modalOpen) || unref(showRoiCalculator)) && {
        key: `dex-${activeDex.wallet}`,
        payload: activeDex.dex(),
      }
    )
  }),
  (dex) => {
    const { state } = useTask(
      async () => {
        const token = pool.value.stakeToken
        const balance = await dex.tokens.getTokenBalanceOfUser(token.id)
        return new BigNumber(balance.toToken(token))
      },
      { immediate: true },
    )
    usePromiseLog(state, 'get-balance')

    return state
  },
)
const balance = computed(() => {
  return balanceScope.value?.expose?.fulfilled?.value ?? null
})

const formattedEarned = computed(() => {
  return new BigNumber(pool.value.earned.toFixed(FORMATTED_BIG_INT_DECIMALS))
})

const formattedStaked = computed(() => {
  return new BigNumber(pool.value.staked.toFixed(FORMATTED_BIG_INT_DECIMALS))
})

const formattedTotalStaked = computed(() => {
  return '$' + new BigNumber(pool.value.totalStaked.toFixed(0, BigNumber.ROUND_UP))
})

const formattedAnnualPercentageRate = computed(() => {
  if (pool.value.annualPercentageRate.isZero()) return '—'
  return '%' + new BigNumber(pool.value.annualPercentageRate.toFixed(2, BigNumber.ROUND_UP))
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
  enable,
  enabled,
} = useEnableState({
  contract: eagerComputed(() => pool.value.stakeToken.id),
  spender: eagerComputed(() => pool.value.id),
  active: expanded,
})

function stake() {
  modalOperation.value = ModalOperation.Stake
}

function unstake() {
  modalOperation.value = ModalOperation.Unstake
}

function addToKaikas(pool: Pool) {
  dexStore.getNamedDexAnyway().agent.watchAsset({
    address: pool.rewardToken.id,
    symbol: pool.rewardToken.symbol,
    decimals: pool.rewardToken.decimals,
  })
}

const swapStore = useSwapStore()

function goToSwapPage() {
  const { rewardToken, stakeToken } = pool.value
  swapStore.setBothTokens({
    tokenA: rewardToken.id,
    tokenB: stakeToken.id,
  })
  router.push({ name: RouteName.Swap })
}

const { state: withdrawState, run: withdraw } = useTask(async () => {
  const earned = pool.value.earned
  await dexStore.getNamedDexAnyway().earn.staking.withdraw({ amount: new Wei(0) })
  return { earned }
})
usePromiseLog(withdrawState, 'staking-pool-withdraw')
wheneverDone(withdrawState, (result) => {
  if (result.fulfilled) {
    const { earned } = result.fulfilled.value
    emit('withdrawn')
    notify({ type: 'ok', description: `${earned} ${pool.value.rewardToken.symbol} tokens were withdrawn` })
  } else {
    notify({
      type: 'err',
      description: `Withdraw ${pool.value.rewardToken.symbol} tokens error`,
      error: result.rejected.reason,
    })
  }
})

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

function openRoiCalculator(event: Event, pool: Pool) {
  event.stopPropagation()
  showRoiCalculator.value = true
  roiPool.value = pool
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
          />
          <KlayCharAvatar
            v-bem="'icon'"
            :symbol="pool.stakeToken.symbol"
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
          <div v-bem="['stats-item-value', { zero: ['0', '$0'].includes(`${value}`) }]">
            {{ value }}
            <KlayIconCalculator
              v-if="label === 'annualPercentageRate' && value !== '—'"
              v-bem="'stats-item-calculator'"
              @click="openRoiCalculator($event, pool)"
            />
            <KlayIconClock
              v-if="label === 'endsIn' && value !== '—'"
              v-bem="'stats-item-clock'"
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
          Enable {{ pool.stakeToken.symbol }}
        </KlayButton>
        <div
          v-if="enabled"
          v-bem="'staked-input-wrapper'"
        >
          <KlayTextField
            v-bem="'staked-input'"
            :model-value="formattedStaked"
            :disabled="true"
          />
          <div v-bem="'staked-input-label'">
            {{ t('ModuleStakingPool.staked', { symbol: pool.stakeToken.symbol }) }}
          </div>
          <div v-bem="'staked-input-buttons'">
            <KlayButton
              v-if="!pool.staked.isZero()"
              v-bem="'unstake'"
              @click="unstake()"
            >
              -
            </KlayButton>
            <KlayButton
              v-if="!pool.staked.isZero()"
              v-bem="'stake-additional'"
              @click="stake()"
            >
              +
            </KlayButton>
            <KlayButton
              v-if="pool.staked.isZero()"
              v-bem="'stake'"
              type="primary"
              @click="stake()"
            >
              Stake {{ pool.stakeToken.symbol }}
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
            :disabled="true"
          />
          <div v-bem="'earned-input-label'">
            {{ t('ModuleStakingPool.earned', { symbol: pool.rewardToken.symbol }) }}
          </div>
          <div v-bem="'earned-input-buttons'">
            <KlayButton
              v-bem="'withdraw'"
              :disabled="pool.earned.isZero()"
              @click="withdraw()"
            >
              Withdraw
            </KlayButton>
          </div>
        </div>
        <KlayButton
          v-if="!enabled"
          v-bem="'get-stake-token'"
          @click="goToSwapPage()"
        >
          Get {{ pool.stakeToken.symbol }}
        </KlayButton>
      </div>
      <div v-bem="'links'">
        <a
          v-bem="'link'"
          :href="`https://baobab.klaytnfinder.io/account/${pool.stakeToken.id}`"
        >
          See Token Info
          <KlayIconLink v-bem="'link-icon'" />
        </a>
        <a v-bem="'link'">
          View Project Site
          <KlayIconLink v-bem="'link-icon'" />
        </a>
        <a
          v-bem="'link'"
          :href="`https://baobab.klaytnfinder.io/account/${pool.id}`"
        >
          View Contract
          <KlayIconLink v-bem="'link-icon'" />
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
    v-model="modalOpen"
    :pool="pool"
    :balance="balance"
    :operation="modalOperation"
    @update:mode="handleModalClose"
    @staked="handleStaked"
    @unstaked="handleUnstaked"
  />

  <ModuleEarnSharedRoiCalculator
    v-if="roiPool"
    v-model:show="showRoiCalculator"
    :type="roiType"
    :staked="roiPool.staked"
    :apr="roiPool.annualPercentageRate"
    :balance="balance"
    :stake-token-price="roiPool.stakeTokenPrice"
    :stake-token-decimals="roiPool.stakeToken.decimals"
    :reward-token-decimals="roiPool.rewardToken.decimals"
    :stake-token-symbol="roiPool.stakeToken.symbol"
    :reward-token-symbol="roiPool.rewardToken.symbol"
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