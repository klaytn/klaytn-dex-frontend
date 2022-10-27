<script setup lang="ts">
import BigNumber from 'bignumber.js'
import { KlayIconCalculator } from '~klay-icons'
import { Pool } from './types'
import { CurrencySymbol } from '@/core'
import { TokensPair } from '@/utils/pair'
import { FORMATTED_BIG_INT_DECIMALS } from './const'

const props = defineProps<{
  name: Pool['name']
  earned: BigNumber | null
  liquidity: BigNumber | null
  annualPercentageRate: BigNumber | null
  multiplier: BigNumber
}>()

const poolSymbols = computed<TokensPair<CurrencySymbol>>(() => {
  const [a, b] = props.name.split('-') as CurrencySymbol[]
  return { tokenA: a, tokenB: b }
})

const emit = defineEmits(['click:roi-calculator'])

const liquidityRounded = computed(() => props.liquidity?.decimalPlaces(0, BigNumber.ROUND_UP))

const formattedMultiplier = computed(() => {
  return 'x' + new BigNumber(props.multiplier.toFixed(FORMATTED_BIG_INT_DECIMALS))
})
</script>

<template>
  <div class="grid grid-cols-5 gap-4 items-center py-3">
    <div class="flex items-center space-x-2">
      <KlaySymbolsPair v-bind="poolSymbols" />

      <span class="title-name">
        {{ name }}
      </span>
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
          <CurrencyFormatTruncate
            :amount="annualPercentageRate"
            :decimals="2"
            symbol="%"
            symbol-position="right"
          />
        </span>

        <KlayIconCalculator
          v-if="annualPercentageRate !== null"
          :class="$style.iconCalc"
          @click.stop="emit('click:roi-calculator')"
        />
      </div>
    </div>

    <div>
      <div :class="$style.title">
        Liquidity
      </div>
      <div :class="$style.value">
        <CurrencyFormat
          :amount="liquidityRounded"
          usd
        />
      </div>
    </div>

    <div>
      <div :class="$style.title">
        Multiplier
      </div>
      <div :class="$style.value">
        {{ formattedMultiplier }}
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
