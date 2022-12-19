<script setup lang="ts">
import { CurrencySymbol, LP_TOKEN_DECIMALS, WeiAsToken } from '@/core'
import { TokensPair } from '@/utils/pair'
import BigNumber from 'bignumber.js'
import { Ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: WeiAsToken<BigNumber>
    symbols?: null | TokensPair<CurrencySymbol>
    maxButton?: boolean
    maxButtonDisabled?: boolean
  }>(),
  { maxButton: true },
)

const emit = defineEmits(['update:modelValue', 'click:max'])

const model = useVModel(props, 'modelValue', emit) as Ref<WeiAsToken<BigNumber>>
const modelDebounced = shallowRef(model.value)

watch(
  model,
  (value) => {
    if (!value.eq(modelDebounced.value)) modelDebounced.value = value
  },
  { immediate: true },
)

watchDebounced(
  modelDebounced,
  (value) => {
    if (!value.eq(model.value)) model.value = value
  },
  { debounce: 500 },
)
</script>

<template>
  <InputCurrencyTemplate
    v-model="modelDebounced"
    :max-button="maxButton"
    :max-button-disabled="maxButtonDisabled"
    bottom
    @click:max="emit('click:max')"
  >
    <template #input>
      <CurrencyInput
        v-model="modelDebounced"
        :decimals="LP_TOKEN_DECIMALS"
      />
    </template>

    <template #top-right>
      <div
        v-if="symbols"
        class="space-x-2 flex items-center"
      >
        <KlaySymbolsPair
          :token-a="symbols.tokenA"
          :token-b="symbols.tokenB"
        />

        <span class="pair-symbols"> {{ symbols.tokenA }}-{{ symbols.tokenB }} </span>
      </div>
    </template>

    <template #bottom-right>
      <slot name="bottom-right" />
    </template>
  </InputCurrencyTemplate>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.pair-symbols {
  font-weight: 600;
  font-size: 14px;
}

.balance {
  font-size: 12px;
  font-weight: 500;
  color: vars.$gray2;
}
</style>
