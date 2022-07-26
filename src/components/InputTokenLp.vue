<script setup lang="ts">
import { Token, tokenWeiToRaw, ValueWei } from '@/core/kaikas'
import { LP_TOKEN_DECIMALS } from '@/core/kaikas/const'
import { TokensPair } from '@/utils/pair'
import { roundTo } from 'round-to'

const props = defineProps<{
  liquidityRaw?: string
  balance?: null | ValueWei<string>
  tokens?: null | TokensPair<Token | null>
}>()

const emit = defineEmits(['update:liquidityRaw', 'click:max'])

const model = computed({
  get: () => {
    const value = props.liquidityRaw
    if (!value) return ''
    return String(roundTo(Number(value), 5))
  },
  set: (v) => emit('update:liquidityRaw', v),
})

const modelDebounced = ref(model.value)
syncRef(model, modelDebounced, { direction: 'ltr' })
watchDebounced(
  modelDebounced,
  (value) => {
    model.value = value
  },
  { debounce: 500 },
)

const tokensNormalized = computed(() => {
  const { tokens } = props
  if (!tokens?.tokenA || !tokens?.tokenB) return null
  return tokens as TokensPair<Token>
})

const formattedBalance = computed(() => {
  const value = props.balance
  if (!value) return null
  const num = Number(tokenWeiToRaw({ decimals: LP_TOKEN_DECIMALS }, value))
  return roundTo(num, 7)
})
</script>

<template>
  <InputTokenTemplate
    v-model="modelDebounced"
    max-button
    bottom
    @click:max="emit('click:max')"
  >
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
      <span class="balance"> Balance: <ValueOrDash :value="formattedBalance" /> </span>
    </template>
  </InputTokenTemplate>
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
