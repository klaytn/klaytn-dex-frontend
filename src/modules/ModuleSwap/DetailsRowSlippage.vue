<script setup lang="ts">
import { SlippageParsed } from './composable.get-amounts'
import cssRows from '../ModuleTradeShared/rows.module.scss.types'

const props = defineProps<{
  data: SlippageParsed
  dimmed?: boolean
}>()

const labelAndAmount = computed(() => {
  return props.data.kind === 'exact-in'
    ? { label: 'Minimum received', amount: props.data.amountOutMin }
    : { label: 'Maximum sold', amount: props.data.amountInMax }
})
</script>

<template>
  <div :class="[cssRows.rowSm, { [cssRows.rowSmDimmed]: dimmed }]">
    <span>{{ labelAndAmount.label }}</span>
    <span>
      <CurrencyFormatTruncate
        :amount="labelAndAmount.amount.quotient"
        :decimals="labelAndAmount.amount.currency.decimals"
      />
    </span>
  </div>
</template>
