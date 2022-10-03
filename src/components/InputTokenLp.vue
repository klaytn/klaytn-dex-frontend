<script setup lang="ts">
import { Token, Wei, WeiAsToken, LP_TOKEN_DECIMALS } from '@/core'
import { formatCurrency } from '@/utils/composable.currency-input'
import { TokensPair } from '@/utils/pair'
import BigNumber from 'bignumber.js'
import { Ref } from 'vue'

const props = defineProps<{
  modelValue: WeiAsToken<BigNumber>
  balance?: null | Wei
  tokens?: null | TokensPair<Token | null>
}>()

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

const tokensNormalized = computed(() => {
  const { tokens } = props
  if (!tokens?.tokenA || !tokens?.tokenB) return null
  return tokens as TokensPair<Token>
})

const balanceAsToken = computed(() => props.balance?.decimals({ decimals: LP_TOKEN_DECIMALS }))
</script>

<template>
  <InputCurrencyTemplate
    v-model="modelDebounced"
    max-button
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
        v-if="tokensNormalized"
        class="space-x-2 flex items-center"
      >
        <KlaySymbolsPair
          :token-a="tokensNormalized.tokenA.symbol"
          :token-b="tokensNormalized.tokenB.symbol"
        />

        <span class="pair-symbols"> {{ tokensNormalized.tokenA.symbol }}-{{ tokensNormalized.tokenB.symbol }} </span>
      </div>
    </template>

    <template #bottom-right>
      <div class="balance flex items-center">
        <pre>Balance: </pre>
        <CurrencyFormatTruncate :amount="balanceAsToken" />
      </div>
    </template>
  </InputCurrencyTemplate>
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

.pair-symbols {
  font-weight: 600;
  font-size: 14px;
}

.balance {
  font-size: 12px;
  font-weight: 500;
  color: $gray2;
}
</style>
