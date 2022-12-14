<script setup lang="ts">
import BigNumber from 'bignumber.js'
import { KlayIconCalculator, KlayIconImportant } from '~klay-icons'
import { Pool } from './types'
import { CurrencySymbol } from '@/core'
import { TokensPair } from '@/utils/pair'
import { FORMATTED_BIG_INT_DECIMALS } from './const'
import { SPopover } from '@soramitsu-ui/ui'

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
  <div class="grid grid-cols-1 md:grid-cols-5 md:gap-4 items-center py-4">
    <div class="flex items-center space-x-2 lt-md:mb-2">
      <KlaySymbolsPair v-bind="poolSymbols" />

      <span>
        {{ name }}
      </span>
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
            symbol="%"
            percent
            symbol-position="right"
          />
        </span>

        <KlayIconCalculator
          v-if="annualPercentageRate !== null"
          :class="$style.iconCalc"
          @click.stop="emit('click:roi-calculator')"
        />

        <SPopover
          placement="right"
          distance="8"
        >
          <template #trigger>
            <span>
              <KlayIconImportant
                v-if="annualPercentageRate === null"
                :class="$style.iconImportant"
              />
            </span>
          </template>

          <template #popper="{ show }">
            <div
              v-if="show"
              :class="$style.popper"
              class="px-3 py-3 bg-white rounded-md shadow-md cursor-text"
            >
              The DEX token is not listed and has no price. For this reason, it is not possible to calculate APR at the
              moment.
            </div>
          </template>
        </SPopover>
      </div>
    </div>

    <div :class="$style.item">
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

    <div :class="$style.item">
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

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  @media only screen and (min-width: vars.$md) {
    display: block;
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

.value-empty {
  color: vars.$gray2;
}

.iconCalc {
  color: vars.$gray2;
  cursor: pointer;
  &:hover {
    color: vars.$blue;
  }
}

.iconImportant {
  color: vars.$gray3;
  &:hover {
    color: vars.$blue;
  }
}

.popper {
  border: 1px solid vars.$gray5; // same as .klay-divider
  z-index: 10;
  max-width: 300px;
  word-wrap: break-word;
  font-weight: 500;
  font-size: 14px;
  line-height: 1.3em;
}
</style>
