<script setup lang="ts">
import { useCurrencyInput } from '@/utils/composable.currency-input'
import BigNumber from 'bignumber.js'
import { Ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: BigNumber
    symbol?: string
    symbolPosition?: 'left' | 'right'
    symbolDelimiter?: string
    decimals: number
    warning?: boolean
  }>(),
  { symbolPosition: 'right' },
)

const emit = defineEmits(['update:modelValue'])
const model = useVModel(props, 'modelValue', emit) as Ref<BigNumber>

const { inputRef } = useCurrencyInput({
  writableModel: model,
  symbol: computed(() =>
    props.symbol
      ? {
          str: props.symbol,
          position: props.symbolPosition,
          delimiter: props.symbolDelimiter,
        }
      : null,
  ),
  decimals: toRef(props, 'decimals'),
})
</script>

<template>
  <input
    ref="inputRef"
    :class="[$style.input, { [$style.warning]: warning }]"
  >
</template>

<style lang="scss" module>
@use '@/styles/vars';

.input {
  color: vars.$dark2;
}

.warning {
  color: vars.$red;
}
</style>
