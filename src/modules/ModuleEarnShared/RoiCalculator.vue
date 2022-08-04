<script setup lang="ts" name="ModuleEarnSharedRoiCalculator">
import { WeiAsToken } from '@/core/kaikas'
import { KlayIconSwitch } from '~klay-icons'
import { SModal } from '@soramitsu-ui/ui'
import BigNumber from 'bignumber.js'
import { RoiType } from '@/types'
import { periodDays } from './const'
import { makeTabsArray } from '@/utils/common'
import { Period, StakeTabs, CompoundingTabs, StakeUnits } from './types'

const { t } = useI18n()
const vBem = useBemClass()

const props = defineProps<{
  show: boolean
  type: RoiType
  apr: BigNumber
  lpApr?: BigNumber
  staked: WeiAsToken<BigNumber>
  balance: WeiAsToken<BigNumber>
  stakeTokenPrice: BigNumber
  stakeTokenDecimals: number
  rewardTokenDecimals: number
  stakeTokenSymbol: string
  rewardTokenSymbol: string
}>()
const {
  type,
  apr,
  lpApr,
  staked,
  balance,
  stakeTokenPrice,
  stakeTokenDecimals,
  rewardTokenDecimals,
  stakeTokenSymbol,
  rewardTokenSymbol,
} = toRefs(props)
const emit = defineEmits<(e: 'update:show', value: boolean) => void>()

const showModel = useVModel(props, 'show', emit)

const stakeTabs = readonly(makeTabsArray(Object.values(StakeTabs)))
const compoundingTabs = readonly(makeTabsArray(Object.values(CompoundingTabs)))

const stakeValueInputWrapper = ref<HTMLElement | null>(null)
const stakeFor = ref(StakeTabs.y1)
const compoundingEnabled = ref(true)
const compoundingEvery = ref(CompoundingTabs.d1)
const stakeValueRaw = ref('$0')
const parsedStakeValue = ref(new BigNumber(0))
const stakeUnits = ref<StakeUnits>(StakeUnits.USD)

function setStakeValueInUSD(amount: number) {
  if (stakeUnits.value === StakeUnits.USD) updateStakeValueRaw(String(amount))
  else
    updateStakeValueRaw(
      new BigNumber(new BigNumber(amount).div(stakeTokenPrice.value).toFixed(stakeTokenDecimals.value)).toString(),
    )
}

function setStakeValueWithBalance() {
  if (stakeUnits.value === StakeUnits.USD)
    updateStakeValueRaw(new BigNumber(balance.value.times(stakeTokenPrice.value).toFixed(2)).toString())
  else updateStakeValueRaw(balance.value.toString())
}

const totalApr = computed(() => {
  return apr.value.plus(lpApr?.value ? lpApr.value : 0)
})

function getPeriodDays(period: Period): number {
  return periodDays[period]
}

const compoundsPerYear = computed(() => {
  return Math.floor(365 / getPeriodDays(compoundingEvery.value))
})

const apy = computed(() => {
  if (!compoundingEnabled.value) return totalApr.value
  return totalApr.value.div(100).div(compoundsPerYear.value).plus(1).pow(compoundsPerYear.value).minus(1).times(100)
})

function numberWithCommas(value: string | number | BigNumber) {
  return value.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',')
}

function updateStakeValueRaw(value: string, handleCursor = false) {
  if (!stakeValueInputWrapper.value) return
  const input = stakeValueInputWrapper.value.getElementsByTagName('input')[0]
  const cursor = input.selectionStart ?? 0
  const digitsAndDotRegex = /^[\d\.]$/i
  const digitsAndDotBeforeCursor = Array.from(value.slice(0, cursor))
    .filter((char) => digitsAndDotRegex.test(char))
    .join('')
  const formattedValue = value.replaceAll(',', '').replace('$', '').replace(stakeTokenSymbol.value, '').trim()
  const parsed = new BigNumber(formattedValue !== '' ? formattedValue : 0)

  if (parsed.isNaN()) return

  const parsedString = parsed.toFixed(stakeTokenDecimals.value).replace(/\.?0*$/g, '')
  const formattedParsedString = numberWithCommas(parsedString) + (value.at(-1) === '.' ? '.' : '')
  let formattedParsedStringWithUnits
  if (stakeUnits.value === StakeUnits.USD) formattedParsedStringWithUnits = '$' + formattedParsedString
  else formattedParsedStringWithUnits = formattedParsedString + ' ' + stakeTokenSymbol.value

  parsedStakeValue.value = parsed
  if (stakeValueRaw.value !== formattedParsedStringWithUnits) stakeValueRaw.value = formattedParsedStringWithUnits

  const index = Array.from(stakeValueRaw.value).findIndex((char, index) => {
    const digitsAndDotBefore = Array.from(stakeValueRaw.value.slice(0, index + 1))
      .filter((char) => digitsAndDotRegex.test(char))
      .join('')
    return digitsAndDotBefore === digitsAndDotBeforeCursor
  })
  let newCursor = index !== -1 ? index + 1 : cursor
  if (stakeValueRaw.value.slice(newCursor) === '0') newCursor++
  nextTick(() => {
    if (handleCursor) input.setSelectionRange(newCursor, newCursor)
  })
}

function formatUSD(amount: BigNumber) {
  return '$' + numberWithCommas(new BigNumber(amount.toFixed(2)))
}

function formatTokens(amount: BigNumber, decimals: number, symbol: string) {
  return new BigNumber(amount.toFixed(decimals)).toString() + ' ' + symbol
}

const stakeValueInAnotherUnits = computed(() => {
  if (stakeUnits.value === StakeUnits.USD) return parsedStakeValue.value.div(stakeTokenPrice.value)
  else return parsedStakeValue.value.times(stakeTokenPrice.value)
})

const formattedStakeValueInAnotherUnits = computed(() => {
  if (stakeUnits.value === StakeUnits.USD)
    return formatTokens(stakeValueInAnotherUnits.value, stakeTokenDecimals.value, stakeTokenSymbol.value)
  else return formatUSD(stakeValueInAnotherUnits.value)
})

const receiveValue = computed(() => {
  return apy.value.div(100).times(parsedStakeValue.value)
})

const formattedReceiveValue = computed(() => {
  if (stakeUnits.value === StakeUnits.USD) return formatUSD(receiveValue.value)
  else return formatTokens(receiveValue.value, rewardTokenDecimals.value, rewardTokenSymbol.value)
})

const receiveValueInAnotherUnits = computed(() => {
  return apy.value.div(100).times(stakeValueInAnotherUnits.value)
})

const formattedReceiveValueInAnotherUnits = computed(() => {
  if (stakeUnits.value === StakeUnits.USD)
    return formatTokens(receiveValueInAnotherUnits.value, rewardTokenDecimals.value, rewardTokenSymbol.value)
  else return formatUSD(receiveValueInAnotherUnits.value)
})

function switchUnits() {
  const newStakeValue = stakeValueInAnotherUnits.value.toFixed(
    stakeUnits.value === StakeUnits.USD ? stakeTokenDecimals.value : 2,
  )
  stakeUnits.value = stakeUnits.value === StakeUnits.USD ? StakeUnits.tokens : StakeUnits.USD
  updateStakeValueRaw(newStakeValue)
}

watch(showModel, (value) => {
  if (value) {
    updateStakeValueRaw(staked.value.toString())
  }
})

const detailsList = computed(() => {
  if (type.value === RoiType.Farming)
    return [
      { label: 'APR (incl. LP rewards)', value: totalApr.value.toFixed(2) + '%' },
      { label: 'Base APR (DEX-Tokens yield only)', value: apr.value.toFixed(2) + '%' },
      { label: 'APY', value: apy.value.toFixed(2) + '%' },
    ]
  else
    return [
      { label: 'APR', value: apr.value.toFixed(2) + '%' },
      { label: 'APY', value: apy.value.toFixed(2) + '%' },
    ]
})
</script>

<template>
  <SModal v-model:show="showModel">
    <KlayModalCard
      v-bem
      class="w-[420px]"
      :title="t('ModuleEarnSharedRoiCalculator.title')"
    >
      <div v-bem="'content'">
        <span v-bem="'label'"> Staked for </span>
        <KlayTabs
          v-model="stakeFor"
          :tabs="stakeTabs"
        />
        <KlaySwitch
          v-model="compoundingEnabled"
          v-bem="'compounding-checkbox'"
          label="Compounding every"
        />
        <KlayTabs
          v-model="compoundingEvery"
          :tabs="compoundingTabs"
          :disabled="!compoundingEnabled"
        />
        <hr class="klay-divider my-4">
        <span v-bem="'label'"> Amount staked </span>
        <div
          ref="stakeValueInputWrapper"
          v-bem="'input-wrapper'"
        >
          <KlayTextField
            v-bem="'input'"
            :model-value="stakeValueRaw"
            @update:model-value="(value: string) => updateStakeValueRaw(value, true)"
          />
          <KlayIconSwitch
            v-bem="'input-switch'"
            @click="switchUnits"
          />
          <div v-bem="'input-another-units'">
            {{ formattedStakeValueInAnotherUnits }}
          </div>
        </div>
        <div v-bem="'amounts'">
          <KlayButton
            v-for="amount in [10, 100, 1000]"
            :key="amount"
            v-bem="'amount'"
            size="sm"
            @click="setStakeValueInUSD(amount)"
          >
            ${{ amount }}
          </KlayButton>
          <KlayButton
            v-bem="'amount'"
            size="sm"
            @click="setStakeValueWithBalance()"
          >
            My balance
          </KlayButton>
        </div>
        <span v-bem="'label'"> You will receive (APY = {{ apy.toFixed(2) }}%) </span>
        <div v-bem="'input-wrapper'">
          <KlayTextField
            v-model="formattedReceiveValue"
            v-bem="'input'"
            :disabled="true"
          />
          <div v-bem="'input-another-units'">
            {{ formattedReceiveValueInAnotherUnits }}
          </div>
        </div>
      </div>
      <KlayCollapse v-bem="'details'">
        <template #head>
          Details
        </template>
        <template #main>
          <div
            v-for="item in detailsList"
            :key="item.label"
            v-bem="'details-item'"
          >
            <div v-bem="'details-item-label'">
              {{ item.label }}
            </div>
            <div v-bem="'details-item-value'">
              {{ item.value }}
            </div>
          </div>
          <ul v-bem="'details-description'">
            <template v-if="type === RoiType.Farming">
              <li>— Calculated based on current rates.</li>
              <li>— LP rewards: 0.17% trading fees, distributed proportionally among LP token holders.</li>
              <li>
                — All figures are estimates provided for your convenience only, and by no means represent guaranteed
                returns.
              </li>
            </template>
            <template v-else>
              <li>— Calculated based on current rates.</li>
              <li>
                — All figures are estimates provided for your convenience only, and by no means represent guaranteed
                returns.
              </li>
            </template>
          </ul>
        </template>
      </KlayCollapse>
    </KlayModalCard>
  </SModal>
</template>

<style lang="sass">
@import '@/styles/vars.sass'

.module-earn-shared-roi-calculator
  width: 345px
  &__content
    display: flex
    flex-direction: column
    align-items: flex-start
  &__label
    margin-bottom: 8px
    font-weight: 700
    font-size: 14px
  &__compounding-checkbox
    margin-top: 16px
    margin-bottom: 8px
  &__input
    &-wrapper
      position: relative
    .s-text-field__input-wrapper
      height: 72px
      input
        padding: 16px 56px 33px 16px
        font-size: 30px
        font-weight: 600
        line-height: 39px
    &-switch
      position: absolute
      right: 16px
      top: 24px
      cursor: pointer
    &-another-units
      position: absolute
      overflow: hidden
      width: calc(100% - 32px)
      left: 16px
      bottom: 6px
      white-space: nowrap
      font-size: 12px
      line-height: 22px
      font-weight: 400
      color: $gray2
  &__amounts
    margin: 8px 0 24px
  &__amount
    flex: 1
    font-size: 12px
    font-weight: 700
    & + &
      margin-left: 8px
  &__details
    margin-top: 16px
    &-item
      display: flex
      justify-content: space-between
      font-size: 12px
      font-weight: 500
      line-height: 28px
    &-description
      padding-top: 8px
      font-size: 10px
      font-weight: 300
      color: $gray2
      line-height: 18px
      border-top: 1px solid $gray5
      white-space: pre-line
</style>
