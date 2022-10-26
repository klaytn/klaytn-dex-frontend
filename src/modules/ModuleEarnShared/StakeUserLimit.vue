<script setup lang="ts">
import BigNumber from 'bignumber.js'
import { Token, WeiAsToken } from '@/core'
import { KlayIconImportant } from '~klay-icons'
import { ModalOperation } from './types'

const props = defineProps<{
  operation: ModalOperation
  staked: WeiAsToken<BigNumber>
  stakeToken: Pick<Token, 'decimals' | 'symbol'>
  stakeAmount: WeiAsToken<BigNumber>
  userLimit?: WeiAsToken<BigNumber> | null
}>()

const emit = defineEmits(['reduce'])

const equationItemMaxWidth = 105

const result = computedEager(() => props.staked.plus(props.stakeAmount))

const isResultGreaterThenLimit = computedEager(() => props.userLimit && result.value.isGreaterThan(props.userLimit))

const resultValueClass = computedEager(() => isResultGreaterThenLimit.value && 'too-many')

const reduce = () => emit('reduce')

const showReduceButton = computedEager(() => isResultGreaterThenLimit.value && !props.stakeAmount.isZero())

const showEquation = computedEager(
  () => props.operation === ModalOperation.Stake && !props.staked.isZero() && !props.stakeAmount.isZero(),
)

const showLimit = computedEager(() => !!props.userLimit && isResultGreaterThenLimit.value)
</script>

<template>
  <div
    v-if="showEquation || showLimit"
    class="container space-y-4"
  >
    <div v-if="showEquation && !stakeAmount.isZero()">
      <div class="equation-item">
        <span class="equation-item-title"> Staked </span>
        <CurrencyFormatTruncate
          :amount="staked"
          :decimals="stakeToken.decimals"
          :max-width="equationItemMaxWidth"
        />
      </div>
      +
      <div class="equation-item">
        <span class="equation-item-title"> Additional </span>
        <CurrencyFormatTruncate
          :amount="stakeAmount"
          :decimals="stakeToken.decimals"
          :max-width="equationItemMaxWidth"
        />
      </div>
      =
      <div class="equation-item">
        <span class="equation-item-title"> Total </span>
        <div :class="resultValueClass">
          <CurrencyFormatTruncate
            :class="resultValueClass"
            :amount="result"
            :decimals="stakeToken.decimals"
            :max-width="equationItemMaxWidth"
          />
        </div>
      </div>
    </div>
    <div
      v-if="showLimit"
      class="limit"
    >
      <KlayIconImportant class="limit-icon" />
      You can total stake a maximum of
      <div class="limit-value">
        <CurrencyFormatTruncate
          :amount="userLimit"
          :decimals="stakeToken.decimals"
          :symbol="stakeToken.symbol"
          :max-width="100"
        />
      </div>
    </div>
    <KlayButton
      v-if="showReduceButton"
      type="primary"
      size="sm"
      @click="reduce"
    >
      Reduce the Staked
    </KlayButton>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.container {
  font-weight: 600;
  font-size: 16px;
  padding: 16px;
  border: 1px solid vars.$gray5;
  border-radius: 8px;
}

.equation {
  &-item {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    vertical-align: bottom;
    &-title {
      top: 0;
      margin-bottom: 6px;
      font-weight: 500;
      font-size: 12px;
      color: vars.$gray2;
    }
  }
}

.limit {
  font-size: 12px;
  font-weight: 500;

  &-icon {
    font-size: 16px;
    display: inline;
    color: vars.$red;
  }

  &-value {
    display: contents;
    font-weight: 700;
  }
}

.too-many {
  color: vars.$red;
}
</style>
