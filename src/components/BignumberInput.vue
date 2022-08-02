<script setup lang="ts" name="BignumberInput">
import BigNumber from 'bignumber.js'

const SymbolPosition = {
  Left: 'left',
  Right: 'right',
} as const

type SymbolPosition = typeof SymbolPosition[keyof typeof SymbolPosition]

const props = defineProps<{
  modelValue: BigNumber
  symbol: string,
  symbolPosition: SymbolPosition,
  decimals: number
}>()
const {
  symbol,
  symbolPosition,
  decimals
} = toRefs(props)
const emit = defineEmits<(e: 'update:modelValue', value: BigNumber) => void>()

const valueRaw = ref('0')
const root = ref<HTMLElement | null>(null)

function numberWithCommas(value: string | number | BigNumber) {
  return value.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
}

function updateValueRaw(value: string, handleCursor = false) {
  if (!root.value) return
  const input = root.value.getElementsByTagName('input')[0]
  const cursor = input.selectionStart ?? 0
  const digitsAndDotRegex = /^[\d\.]$/i
  const digitsAndDotBeforeCursor = Array.from(value.slice(0, cursor)).filter(char => digitsAndDotRegex.test(char)).join('')
  const formattedValue = value.replaceAll(',', '').replace(symbol.value, '').trim()
  const parsed = new BigNumber(formattedValue !== '' ? formattedValue : 0)

  if (parsed.isNaN()) return

  const parsedString = parsed.toFixed(decimals.value).replace(/\.?0*$/g, '')
  const formattedParsedString = numberWithCommas(parsedString) + (value.at(-1) === '.' ? '.' : '')
  let formattedParsedStringWithUnits
  if (symbolPosition.value === SymbolPosition.Left)
    formattedParsedStringWithUnits = symbol.value + formattedParsedString
  else
    formattedParsedStringWithUnits = formattedParsedString + symbol.value

  emit('update:modelValue', parsed)
  if (valueRaw.value !== formattedParsedStringWithUnits)
    valueRaw.value = formattedParsedStringWithUnits

  const index = Array.from(valueRaw.value).findIndex((char, index) => {
    const digitsAndDotBefore = Array.from(valueRaw.value.slice(0, index + 1)).filter(char => digitsAndDotRegex.test(char)).join('')
    return digitsAndDotBefore === digitsAndDotBeforeCursor
  })
  let newCursor = index !== -1 ? (index + 1) : cursor
  if (valueRaw.value.slice(newCursor) === '0') newCursor++
  nextTick(() => {
    if (handleCursor) input.setSelectionRange(newCursor, newCursor)
  })
}
</script>

<template>
  <KlayTextField
    ref="root"
    v-bem="'input'"
    :model-value="valueRaw"
    @update:model-value="(value: string) => updateValueRaw(value, true)"
  />
</template>

<style lang="sass">
</style>