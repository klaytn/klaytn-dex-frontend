<script setup lang="ts" name="ModuleEarnSharedRoiCalculator">
import { CURRENCY_USD, WeiAsToken } from '@/core'
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

const props = defineProps<{
  show: boolean
  type: RoiType
  apr: BigNumber
  lpApr?: BigNumber
  staked: WeiAsToken<BigNumber>
  balance: WeiAsToken<BigNumber>
  /**
   * USD
   */
  stakeTokenPrice: BigNumber
  stakeTokenDecimals: number
  rewardTokenDecimals: number
  stakeTokenSymbol: string
  rewardTokenSymbol: string
}>()

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
    return (!reverse && !isUSD) || (reverse && isUSD) ? unref(symbol) : MASK_SYMBOL_USD
  })

const stakeTokenSymbolAsMask = computed<MaskSymbol>(() => ({ str: props.stakeTokenSymbol, position: 'right' }))

const rewardTokenSymbolAsMask = computed<MaskSymbol>(() => ({ str: props.rewardTokenSymbol, position: 'right' }))

// #endregion

// #region Input & Mask

const inputCurrencySymbol = useMaskSymbolOrUSD(stakeTokenSymbolAsMask)

const inputDecimals = eagerComputed(() =>
  stakeUnits.value === StakeUnits.USD ? CURRENCY_USD.decimals : props.stakeTokenDecimals,
)

// #endregion

function setStakeValueInUSD(amount: BigNumber | number) {
  if (stakeUnits.value === StakeUnits.USD) parsedStakeValue.value = new BigNumber(amount)
  else parsedStakeValue.value = new BigNumber(amount).div(props.stakeTokenPrice)
}

function setStakeValueWithBalance() {
  if (stakeUnits.value === StakeUnits.USD)
    parsedStakeValue.value = props.balance.times(props.stakeTokenPrice).decimalPlaces(2)
  else parsedStakeValue.value = props.balance
}

const totalApr = computed(() => {
  return props.apr.plus(props.lpApr ?? 0)
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
  if (stakeUnits.value === StakeUnits.USD) return parsedStakeValue.value.div(props.stakeTokenPrice)
  else return parsedStakeValue.value.times(props.stakeTokenPrice)
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
  parsedStakeValue.value = stakeValueInAnotherUnits.value
  stakeUnits.value = stakeUnits.value === StakeUnits.USD ? StakeUnits.tokens : StakeUnits.USD
}

watch(
  showModel,
  (value) => {
    if (value) {
      nextTick(() => {
        setStakeValueInUSD(props.staked)
      })
    }
  },
  { immediate: true },
)

const detailsList = computed(() => {
  if (props.type === RoiType.Farming)
    return [
      { label: 'APR (incl. LP rewards)', value: totalApr.value.toFixed(2) + '%' },
      { label: 'Base APR (DEX-Tokens yield only)', value: props.apr.toFixed(2) + '%' },
      { label: 'APY', value: apy.value.toFixed(2) + '%' },
    ]
  else
    return [
      { label: 'APR', value: props.apr.toFixed(2) + '%' },
      { label: 'APY', value: apy.value.toFixed(2) + '%' },
    ]
})
</script>

<template>
  <SModal v-model:show="showModel">
    <KlayModalCard
      class="w-[420px] flex flex-col"
      :title="t('ModuleEarnSharedRoiCalculator.title')"
    >
      <template #body>
        <div class="px-4 pb-5 space-y-4">
          <div class="space-y-2 flex flex-col items-start">
            <span class="label"> Staked for </span>
            <KlayTabs
              v-model="stakeFor"
              :tabs="stakeTabs"
            />
          </div>

          <div class="space-y-2 flex flex-col items-start">
            <KlaySwitch
              v-model="compoundingEnabled"
              label="Compounding every"
            />

            <KlayTabs
              v-model="compoundingEvery"
              :tabs="compoundingTabs"
              :disabled="!compoundingEnabled"
            />
          </div>

          <hr class="klay-divider">

          <div class="space-y-2">
            <span class="label"> Amount staked </span>

            <InputCurrencyTemplate
              right
              bottom
              no-input-filter
            >
              <template #input>
                <CurrencyInput
                  v-model="parsedStakeValue"
                  :decimals="inputDecimals"
                  :symbol="inputCurrencySymbol.str"
                  :symbol-position="inputCurrencySymbol.position"
                  :symbol-delimiter="inputCurrencySymbol.delimiter"
                  data-testid="input-staked"
                />
              </template>

              <template #right>
                <div class="flex items-center h-full">
                  <KlayIconSwitch
                    class="cursor-pointer"
                    data-testid="switch-units"
                    @click="switchUnits"
                  />
                </div>
              </template>

              <template #bottom-left>
                <span
                  data-testid="input-staked-alt-units"
                  class="input-alt-units"
                >
                  {{ formattedStakeValueInAnotherUnits }}
                </span>
              </template>
            </InputCurrencyTemplate>

            <div class="space-x-2">
              <KlayButton
                v-for="amount in [10, 100, 1000]"
                :key="amount"
                size="sm"
                @click="setStakeValueInUSD(amount)"
              >
                ${{ amount }}
              </KlayButton>
              <KlayButton
                size="sm"
                @click="setStakeValueWithBalance()"
              >
                My balance
              </KlayButton>
            </div>
          </div>

          <div class="space-y-2">
            <span class="label"> You will receive (APY = {{ apy.toFixed(2) }}%) </span>
            <InputCurrencyTemplate bottom>
              <template #input>
                <input
                  data-testid="receive-value"
                  readonly
                  :value="formattedReceiveValue"
                >
              </template>

              <template #bottom-left>
                <span class="input-alt-units">
                  {{ formattedReceiveValueInAnotherUnits }}
                </span>
              </template>
            </InputCurrencyTemplate>
          </div>

          <KlayCollapse>
            <template #head>
              Details
            </template>
            <template #main>
              <div class="space-y-4 pt-2">
                <div class="space-y-3">
                  <div
                    v-for="item in detailsList"
                    :key="item.label"
                    class="details-item"
                  >
                    <div>
                      {{ item.label }}
                    </div>
                    <div>
                      {{ item.value }}
                    </div>
                  </div>
                </div>

                <hr class="klay-divider">

                <ul class="details-list">
                  <template v-if="type === RoiType.Farming">
                    <li>Calculated based on current rates.</li>
                    <li>LP rewards: 0.17% trading fees, distributed proportionally among LP token holders.</li>
                    <li>
                      All figures are estimates provided for your convenience only, and by no means represent guaranteed
                      returns.
                    </li>
                  </template>
                  <template v-else>
                    <li>Calculated based on current rates.</li>
                    <li>
                      All figures are estimates provided for your convenience only, and by no means represent guaranteed
                      returns.
                    </li>
                  </template>
                </ul>
              </div>
            </template>
          </KlayCollapse>
        </div>
      </template>
    </KlayModalCard>
  </SModal>
</template>

<style lang="scss" scoped>
@use '@/styles/vars.sass';

.label {
  font-weight: 700;
  font-size: 14px;
}
.details-list {
  list-style: inside '— ';
  font-size: 10px;
  font-weight: 300;
  color: vars.$gray2;
  line-height: 18px;
}

.details-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 500;
}

.input-alt-units {
  overflow: hidden;
  width: 100%;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 400;
  color: vars.$gray2;
}
</style>
