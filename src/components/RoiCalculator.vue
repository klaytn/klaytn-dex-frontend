<script setup lang="ts" name="RoiCalculator">
import { SModal } from '@soramitsu-ui/ui'
import BigNumber from 'bignumber.js'
import { RoiType, Tab } from '@/types'

const StakeTabs = {
  d1: '1D',
  d7: '7D',
  d30: '30D',
  y1: '1Y',
  y5: '5Y'
} as const

type StakeTabs = typeof StakeTabs[keyof typeof StakeTabs]

const CompoundingTabs = {
  d1: '1D',
  d7: '7D',
  d14: '14D',
  d30: '30D'
} as const

type CompoundingTabs = typeof CompoundingTabs[keyof typeof CompoundingTabs]

const StakeUnits = {
  tokens: 'tokens',
  USD: 'USD',
} as const

type StakeUnits = typeof StakeUnits[keyof typeof StakeUnits]

const { t } = useI18n()
const vBem = useBemClass()

const props = defineProps<{
  show: boolean
  type: RoiType
  apr: BigNumber
  lpApr: BigNumber,
  staked: BigNumber,
  balance: BigNumber
}>()
const { apr, lpApr, staked, balance } = toRefs(props)
const emit = defineEmits<(e: 'update:show', value: boolean) => void>()

const expose

const showModel = useVModel(props, 'show', emit)

function makeTabsArray(data: string[]): Tab[] {
  return data.map(item => ({
    id: item,
    label: item
  }))
}

const stakeTabs = readonly(makeTabsArray(Object.values(StakeTabs)))
const compoundingTabs = readonly(makeTabsArray(Object.values(CompoundingTabs)))

const stakeFor = ref(StakeTabs.y1)
const compoundingEnabled = ref(true)
const compoundingEvery = ref(CompoundingTabs.d1)
const stakeValue = ref('0')
const stakeValueInAnotherUnits = ref('0')
const stakeUnits = ref<StakeUnits>(StakeUnits.USD)

function setAmount(amount: BigNumber | number) {
  stakeValue.value = new BigNumber(amount).toString()
}

const computedApr = computed(() => {
  return apr.value.plus(lpApr.value)
})

function switchUnits() {
  stakeUnits.value = stakeUnits.value === StakeUnits.USD ? StakeUnits.tokens : StakeUnits.USD
}

watch(showModel, (value) => {
  if (value) {
    stakeValue.value = staked.value.toString()
  }
})
</script>

<template>
  <SModal v-model:show="showModel">
    <KlayModalCard
      v-bem
      class="w-[420px]"
      :title="t('RoiCalculator.title')"
    >
      <div v-bem="'content'">
        <span v-bem="'label'">
          Staked for
        </span>
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
        <hr>
        <span v-bem="'label'">
          Amount staked
        </span>
        <div v-bem="'input-wrapper'">
          <KlayTextField
            v-model="stakeValue"
            v-bem="'input'"
          />
          <IconKlaySwitch
            v-bem="'input-switch'"
            @click="switchUnits"
          />
          <div
            v-bem="'input-another-units'"
          >
            {{ stakeValueInAnotherUnits }}
          </div>
        </div>
        <div v-bem="'amounts'">
          <KlayButton
            v-for="amount in [10, 100, 1000]"
            :key="amount"
            v-bem="'amount'"
            size="sm"
            @click="setAmount(amount)"
          >
            {{ amount }}%
          </KlayButton>
          <KlayButton
            v-bem="'amount'"
            size="sm"
            @click="setAmount(balance)"
          >
            My balance
          </KlayButton>
        </div>
        <span v-bem="'label'">
          You will receive (APR = {{ computedApr.toFixed(2) }}%)
        </span>
        <div v-bem="'input-wrapper'">
          <KlayTextField
            v-model="stakeValue"
            v-bem="'input'"
          />
          <IconKlaySwitch
            v-bem="'input-switch'"
            @click="switchUnits"
          />
          <div
            v-bem="'input-another-units'"
          >
            {{ stakeValueInAnotherUnits }}
          </div>
        </div>
      </div>
    </KlayModalCard>
  </SModal>
</template>

<style lang="sass">
@import '@/styles/vars.sass'

.roi-calculator
  width: 345px
  hr
    width: 100%
    height: 1px
    margin: 16px 0
    background-color: $gray5
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
        padding: 16px 92px 33px 16px
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
      left: 16px
      bottom: 6px
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
</style>
