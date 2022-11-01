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
  <input ref="inputRef">
</template>
