<script setup lang="ts">
import { CurrencySymbol } from '@/core'
import BigNumber from 'bignumber.js'
import { KlayIconCalculator, KlayIconClock } from '~klay-icons'

const props = defineProps<{
  rewardTokenSymbol: CurrencySymbol
  stakeTokenSymbol: CurrencySymbol
  earned: BigNumber | null
  totalStakedUsd: BigNumber | null
  annualPercentageRate: BigNumber | null
  startsIn: number
  endsIn: number
}>()

const emit = defineEmits(['click:roi-calculator'])

const aprRounded = computed(() => props.annualPercentageRate?.decimalPlaces(2, BigNumber.ROUND_UP))

const totalRounded = computed(() => props.totalStakedUsd?.decimalPlaces(0, BigNumber.ROUND_UP))

const nonNegativeStartsIn = computed(() => Math.max(0, props.startsIn))
const nonNegativeEndsIn = computed(() => Math.max(0, props.endsIn))
</script>

<template>
  <div class="grid grid-cols-5 gap-4 items-center py-3">
    <div class="flex items-center space-x-6">
      <div class="relative">
        <KlayCharAvatar
          size="36"
          :symbol="stakeTokenSymbol"
        />
        <KlayCharAvatar
          size="20"
          :symbol="rewardTokenSymbol"
          class="absolute bottom-0 right-0 -mr-10px"
        />
      </div>

      <div>
        <div :class="$style.title">
          Stake {{ stakeTokenSymbol }}
        </div>
        <div :class="$style.value">
          Earn {{ rewardTokenSymbol }}
        </div>
      </div>
    </div>

    <div>
      <div :class="$style.title">
        Earned
      </div>
      <div :class="[$style.value, { [$style.valueEmpty]: !earned || earned.isEqualTo(0) }]">
        <CurrencyFormatTruncate :amount="earned" />
      </div>
    </div>

    <div>
      <div :class="$style.title">
        Total staked
      </div>
      <div :class="$style.value">
        <CurrencyFormat
          :amount="totalRounded"
          usd
        />
      </div>
    </div>

    <div>
      <div
        :class="$style.title"
        title="Annual percentage rate"
      >
        APR
      </div>
      <div
        :class="$style.value"
        class="flex items-center"
      >
        <span class="mr-2">
          <CurrencyFormat
            :amount="aprRounded"
            symbol="%"
            symbol-delimiter=""
            symbol-position="right"
          />
        </span>

        <KlayIconCalculator
          v-if="aprRounded !== undefined"
          :class="$style.iconCalc"
          @click.stop="emit('click:roi-calculator')"
        />
      </div>
    </div>

    <div v-if="nonNegativeStartsIn">
      <div :class="$style.title">
        Starts in
      </div>
      <div
        :class="$style.value"
        class="flex items-center"
      >
        <span class="mr-2">
          <CurrencyFormat :amount="nonNegativeStartsIn" />
        </span>

        <KlayIconClock />
      </div>
    </div>

    <div v-else>
      <div :class="$style.title">
        Ends in
      </div>
      <div
        :class="[$style.value, { [$style.valueEmpty]: !nonNegativeEndsIn }]"
        class="flex items-center"
      >
        <template v-if="nonNegativeEndsIn">
          <span class="mr-2">
            <CurrencyFormat :amount="nonNegativeEndsIn" />
          </span>

          <KlayIconClock />
        </template>
        <template v-else>
          &mdash;
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
@use '@/styles/vars';

.title {
  font-weight: 500;
  font-size: 12px;
  color: vars.$gray2;
  line-height: 100%;
}

.value {
  font-weight: 600;
  font-size: 16px;
  color: vars.$dark;
  margin-top: 2px;
  margin-bottom: 12px;
}

.valueEmpty {
  color: vars.$gray2;
}

.iconCalc {
  color: vars.$gray2;
  cursor: pointer;
  &:hover {
    color: vars.$blue;
  }
}
</style>
