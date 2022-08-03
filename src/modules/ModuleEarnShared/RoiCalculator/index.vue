<script setup lang="ts" name="ModuleEarnSharedRoiCalculator">
import { WeiAsToken } from '@/core/kaikas'
import { KlayIconSwitch } from '~klay-icons'
import { SModal } from '@soramitsu-ui/ui'
import BigNumber from 'bignumber.js'
import { RoiType } from '@/types'
import { periodDays } from './const'
import { formatNumberWithCommas, makeTabsArray } from '@/utils/common'
import { StakeTabs, CompoundingTabs, StakeUnits } from './types'
import { useBigNumberInput } from '@/utils/composable.input-bignumber'
import { Ref } from 'vue'

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

const stakeFor = ref(StakeTabs.y1)
const compoundingEnabled = ref(true)
const compoundingEvery = ref(CompoundingTabs.d1)
const parsedStakeValue = shallowRef(new BigNumber(0))
const stakeUnits = ref<StakeUnits>(StakeUnits.USD)

const inputElemComponent = templateRef('input')
const inputElem = computed(() => {
  const component = unref(inputElemComponent) as { inputElem: Ref<HTMLInputElement | null> } | null
  return unref(component?.inputElem) ?? null
})

const inputSymbol = computed<{ symbol: string; position: 'right' | 'left' }>(() => {
  return stakeUnits.value === StakeUnits.USD
    ? {
        symbol: '$',
        position: 'left',
      }
    : {
        symbol: ' ' + stakeTokenSymbol.value,
        position: 'right',
      }
})

const { masked: maskedInput, update: updateMasked } = useBigNumberInput({
  modelValue: parsedStakeValue,
  updateModelValue: (value) => {
    parsedStakeValue.value = value
  },
  inputElem,
  symbol: computed(() => inputSymbol.value.symbol),
  symbolPosition: computed(() => inputSymbol.value.position),
  decimals: stakeTokenDecimals,
})

function setStakeValueInUSD(amount: BigNumber | number) {
  if (stakeUnits.value === StakeUnits.USD) updateMasked(amount.toFixed(stakeTokenDecimals.value))
  else
    updateMasked(
      new BigNumber(new BigNumber(amount).div(stakeTokenPrice.value).toFixed(stakeTokenDecimals.value)).toString(),
    )
}

function setStakeValueWithBalance() {
  if (stakeUnits.value === StakeUnits.USD)
    updateMasked(new BigNumber(balance.value.times(stakeTokenPrice.value).toFixed(2)).toString())
  else updateMasked(balance.value.toString())
}

const totalApr = computed(() => {
  return apr.value.plus(lpApr?.value ? lpApr.value : 0)
})

const compoundsPerYear = computed(() => {
  return Math.floor(365 / periodDays[compoundingEvery.value])
})

const apy = computed(() => {
  if (!compoundingEnabled.value) return totalApr.value
  return totalApr.value.div(100).div(compoundsPerYear.value).plus(1).pow(compoundsPerYear.value).minus(1).times(100)
})

function formatUSD(amount: BigNumber) {
  return '$' + formatNumberWithCommas(new BigNumber(amount.toFixed(2)))
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
  return apy.value
    .div(100)
    .times(parsedStakeValue.value)
    .times(periodDays[stakeFor.value] / 365)
})

const formattedReceiveValue = computed(() => {
  if (stakeUnits.value === StakeUnits.USD) return formatUSD(receiveValue.value)
  else return formatTokens(receiveValue.value, rewardTokenDecimals.value, rewardTokenSymbol.value)
})

const receiveValueInAnotherUnits = computed(() => {
  return apy.value
    .div(100)
    .times(stakeValueInAnotherUnits.value)
    .times(periodDays[stakeFor.value] / 365)
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
  updateMasked(newStakeValue)
}

watch(
  showModel,
  (value) => {
    if (value) {
      nextTick(() => {
        setStakeValueInUSD(staked.value)
      })
    }
  },
  { immediate: true },
)

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
      class="w-[420px] flex flex-col"
      :title="t('ModuleEarnSharedRoiCalculator.title')"
    >
      <template #body>
        <div
          v-bem="'content'"
          class="px-4 pb-5"
        >
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

          <InputTokenTemplate
            ref="input"
            right
            bottom
            no-input-filter
            :model-value="maskedInput"
            data-testid="staked-input"
            @update:model-value="(value: string) => updateMasked(value, true)"
          >
            <template #right>
              <KlayIconSwitch
                v-bem="'input-switch'"
                @click="switchUnits"
              />
            </template>

            <template #bottom-left>
              <span v-bem="'input-another-units'">
                {{ formattedStakeValueInAnotherUnits }}
              </span>
            </template>
          </InputTokenTemplate>

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

          <InputTokenTemplate
            data-testid="receive-value"
            input-readonly
            :model-value="formattedReceiveValue"
          >
            <template #bottom-right>
              <span v-bem="'input-another-units'">
                {{ formattedReceiveValueInAnotherUnits }}
              </span>
            </template>
          </InputTokenTemplate>

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
        </div>
      </template>
    </KlayModalCard>
  </SModal>
</template>

<style lang="sass">
@import '@/styles/vars.sass'

.module-earn-shared-roi-calculator
  width: 345px
  &__content
    flex-grow: 1
    overflow-y: auto
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
    &-switch
      cursor: pointer
    &-another-units
      overflow: hidden
      white-space: nowrap
      font-size: 12px
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
    width: 100%
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
