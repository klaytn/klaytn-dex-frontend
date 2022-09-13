<script setup lang="ts" name="ModuleEarnSharedRoiCalculator">
import { WeiAsToken } from '@/core'
import { KlayIconSwitch } from '~klay-icons'
import { SModal } from '@soramitsu-ui/ui'
import BigNumber from 'bignumber.js'
import { RoiType } from '@/types'
import { PERIOD_DAYS } from './const'
import { makeTabsArray } from '@/utils/common'
import { StakeTabs, CompoundingTabs, StakeUnits } from './types'
import { useFormattedCurrency, MaskSymbol, SYMBOL_USD as MASK_SYMBOL_USD } from '@/utils/composable.currency-input'
import { Ref } from 'vue'
import { MaybeRef } from '@vueuse/core'

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

const stakeFor = ref<StakeTabs>(StakeTabs.y1)
const compoundingEnabled = ref(true)
const compoundingEvery = ref(CompoundingTabs.d1)
const parsedStakeValue = shallowRef(new BigNumber(0))
const stakeUnits = ref<StakeUnits>(StakeUnits.USD)

// #region Symbols

const useMaskSymbolOrUSD = (symbol: MaybeRef<MaskSymbol>, reverse = false): Ref<MaskSymbol> =>
  computed(() => {
    const isUSD = stakeUnits.value === StakeUnits.USD
    return (!reverse && isUSD) || (reverse && !isUSD) ? unref(symbol) : MASK_SYMBOL_USD
  })

const stakeTokenSymbolAsMask = computed<MaskSymbol>(() => ({ str: stakeTokenSymbol.value, position: 'right' }))

const rewardTokenSymbolAsMask = computed<MaskSymbol>(() => ({ str: rewardTokenSymbol.value, position: 'right' }))

// #endregion

// #region Input & Mask

const inputCurrencySymbol = useMaskSymbolOrUSD(stakeTokenSymbolAsMask)

// #endregion

function setStakeValueInUSD(amount: BigNumber | number) {
  if (stakeUnits.value === StakeUnits.USD)
    parsedStakeValue.value = new BigNumber(amount).decimalPlaces(stakeTokenDecimals.value)
  else parsedStakeValue.value = new BigNumber(amount).div(stakeTokenPrice.value).decimalPlaces(stakeTokenDecimals.value)
}

function setStakeValueWithBalance() {
  if (stakeUnits.value === StakeUnits.USD)
    parsedStakeValue.value = balance.value.times(stakeTokenPrice.value).decimalPlaces(2)
  else parsedStakeValue.value = balance.value
}

const totalApr = computed(() => {
  return apr.value.plus(lpApr?.value ? lpApr.value : 0)
})

const compoundsPerYear = computed(() => {
  return Math.floor(365 / PERIOD_DAYS[compoundingEvery.value])
})

const apy = computed(() => {
  if (!compoundingEnabled.value) return totalApr.value
  return totalApr.value.div(100).div(compoundsPerYear.value).plus(1).pow(compoundsPerYear.value).minus(1).times(100)
})

// #region Different values

const stakeValueInAnotherUnits = computed(() => {
  if (stakeUnits.value === StakeUnits.USD) return parsedStakeValue.value.div(stakeTokenPrice.value)
  else return parsedStakeValue.value.times(stakeTokenPrice.value)
})

const formattedStakeValueInAnotherUnits = useFormattedCurrency({
  amount: stakeValueInAnotherUnits,
  symbol: useMaskSymbolOrUSD(stakeTokenSymbolAsMask, true),
  // decimals: stakeTokenDecimals
})

const useReceiveValue = (stake: Ref<BigNumber>) =>
  computed(() =>
    apy.value
      .div(100)
      .times(stake.value)
      .times(PERIOD_DAYS[stakeFor.value] / 365),
  )

const receiveValue = useReceiveValue(parsedStakeValue)

const formattedReceiveValue = useFormattedCurrency({
  amount: receiveValue,
  symbol: useMaskSymbolOrUSD(rewardTokenSymbolAsMask),
  // decimals: rewardTokenDecimals
})

const receiveValueInAnotherUnits = useReceiveValue(stakeValueInAnotherUnits)

const formattedReceiveValueInAnotherUnits = useFormattedCurrency({
  amount: receiveValueInAnotherUnits,
  symbol: useMaskSymbolOrUSD(rewardTokenSymbolAsMask, true),
  // decimals: rewardTokenDecimals
})

// #endregion

function switchUnits() {
  parsedStakeValue.value = stakeValueInAnotherUnits.value.decimalPlaces(
    stakeUnits.value === StakeUnits.USD ? stakeTokenDecimals.value : 2,
  )
  stakeUnits.value = stakeUnits.value === StakeUnits.USD ? StakeUnits.tokens : StakeUnits.USD
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

          <div>
            <InputCurrencyTemplate
              right
              bottom
              no-input-filter
              data-testid="staked-input"
            >
              <template #input>
                <CurrencyInput
                  v-model="parsedStakeValue"
                  :decimals="stakeTokenDecimals"
                  :symbol="inputCurrencySymbol.str"
                  :symbol-position="inputCurrencySymbol.position"
                  :symbol-delimiter="inputCurrencySymbol.delimiter"
                />
                <input
                  ref="inputRef"
                  data-testid="staked-input"
                >
              </template>

              <template #right>
                <div class="flex items-center h-full">
                  <KlayIconSwitch
                    v-bem="'input-switch'"
                    @click="switchUnits"
                  />
                </div>
              </template>

              <template #bottom-left>
                <span
                  v-bem="'input-another-units'"
                  class="truncate"
                  :title="formattedStakeValueInAnotherUnits"
                >
                  {{ formattedStakeValueInAnotherUnits }}
                </span>
              </template>
            </InputCurrencyTemplate>
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

          <div>
            <InputCurrencyTemplate
              data-testid="receive-value"
              input-readonly
              :model-value="formattedReceiveValue"
            >
              <template #bottom-right>
                <span v-bem="'input-another-units'">
                  {{ formattedReceiveValueInAnotherUnits }}
                </span>
              </template>
            </InputCurrencyTemplate>
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
      font-size: 12px
      font-weight: 400
      color: $gray2
      user-select: none
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
