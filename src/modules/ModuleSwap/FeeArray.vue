<script setup lang="ts">
import { TokenAmount, TokenImpl } from '@/core'
import { FeeItem } from './utils'

interface Props {
  data: FeeItem[]
}

const props = defineProps<Props>()

const feeParsed = computed(() =>
  props.data.map(({ fee, pair: [input, output] }) => {
    const amount = TokenAmount.fromWei(new TokenImpl(input), fee)
    const path = `${input.symbol} > ${output.symbol}`
    return { fee: amount, path }
  }),
)
</script>

<template>
  <div class="grid gap-1">
    <template
      v-for="({ fee, path }, i) in feeParsed"
      :key="i"
    >
      <CurrencyFormatTruncate
        :amount="fee.quotient"
        :decimals="fee.currency.decimals"
        :symbol="fee.currency.symbol"
        max-width="65"
        class="place-self-end"
      />

      <span>({{ path }})</span>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.grid {
  grid-template-columns: 1fr auto;
}
</style>
