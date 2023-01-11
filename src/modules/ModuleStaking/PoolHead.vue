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
  userLimit: BigNumber | null
  userLimitEndsIn: number
}>()

const emit = defineEmits(['click:roi-calculator'])

const totalRounded = computed(() => props.totalStakedUsd?.decimalPlaces(0, BigNumber.ROUND_UP))

const nonNegativeStartsIn = computed(() => Math.max(0, props.startsIn))
const nonNegativeEndsIn = computed(() => Math.max(0, props.endsIn))
const nonNegativeUserLimitEndsIn = computed(() => Math.max(0, props.userLimitEndsIn))
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-5 md:gap-4 items-center py-4">
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

      <div class="flex flex-col">
        <div :class="$style.title">
          Stake {{ stakeTokenSymbol }}
        </div>
        <div :class="$style.value">
          Earn {{ rewardTokenSymbol }}
        </div>
      </div>
    </div>

    <div :class="$style.item">
      <div :class="$style.title">
        Earned
      </div>
      <div :class="[$style.value, { [$style.valueEmpty]: !earned || earned.isEqualTo(0) }]">
        <CurrencyFormatTruncate :amount="earned" />
      </div>
    </div>

    <div :class="$style.item">
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

    <div :class="$style.item">
      <div
        :class="$style.title"
        title="Annual percentage rate"
      >
        APR
      </div>
      <div
        :class="[$style.value, { [$style.valueEmpty]: !annualPercentageRate }]"
        class="flex items-center"
      >
        <CurrencyFormatTruncate
          :amount="annualPercentageRate"
          symbol="%"
          percent
          symbol-position="right"
        />

        <KlayIconCalculator
          v-if="annualPercentageRate !== null"
          :class="$style.iconCalc"
          class="ml-2"
          @click.stop="emit('click:roi-calculator')"
        />
      </div>
    </div>

    <div
      v-if="nonNegativeStartsIn"
      :class="$style.item"
    >
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

    <div
      v-else
      :class="$style.item"
    >
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

    <div :class="[$style.item, $style.mobile]">
      <div :class="$style.title">
        User limit
      </div>
      <div :class="[$style.value, { [$style.valueEmpty]: !userLimit }]">
        <CurrencyFormatTruncate :amount="userLimit" />
      </div>
    </div>

    <div :class="[$style.item, $style.mobile]">
      <div :class="$style.title">
        User limit ends in
      </div>
      <div
        :class="[$style.value, { [$style.valueEmpty]: !nonNegativeUserLimitEndsIn }]"
        class="flex items-center"
      >
        <template v-if="nonNegativeUserLimitEndsIn">
          <span class="mr-2">
            <CurrencyFormat :amount="nonNegativeUserLimitEndsIn" />
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

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  @media only screen and (min-width: vars.$md) {
    flex-direction: column;
    align-items: flex-start;
  }
}

.mobile {
  @media only screen and (min-width: vars.$md) {
    display: none;
  }
}

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
  @media only screen and (min-width: vars.$md) {
    margin-top: 2px;
    margin-bottom: 12px;
  }
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
