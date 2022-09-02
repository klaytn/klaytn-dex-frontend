import { MaybeElementRef, MaybeRef } from '@vueuse/core'
import BigNumber from 'bignumber.js'
import { Ref } from 'vue'
import { formatNumberWithCommas } from './common'

type SymbolPosition = 'left' | 'right'

interface Props {
  modelValue: Ref<BigNumber>
  updateModelValue: (value: BigNumber) => void
  inputElem: MaybeElementRef<null | HTMLInputElement>
  symbol: MaybeRef<string>
  symbolPosition: MaybeRef<SymbolPosition>
  decimals: MaybeRef<number>
}

/**
 * # Notes
 *
 * Masked value will not be updated automatically when any of props is updated
 */
export function useBigNumberInput(props: Props): {
  masked: Readonly<Ref<string>>
  update: (value: string, preserveCursor?: boolean) => void
} {
  const masked = ref('0')

  function update(value: string, preserveCursor = false) {
    const input = unrefElement(props.inputElem)
    if (!input) return

    const cursor = input.selectionStart ?? 0
    const digitsAndDotRegex = /^[\d\.]$/i
    const digitsAndDotBeforeCursor = Array.from(value.slice(0, cursor))
      .filter((char) => digitsAndDotRegex.test(char))
      .join('')
    const formattedValue = value.replaceAll(',', '').replace(unref(props.symbol), '').trim()
    const parsed = new BigNumber(formattedValue !== '' ? formattedValue : 0)

    if (parsed.isNaN()) return
    props.updateModelValue(parsed)

    const parsedString = parsed.toFixed(unref(props.decimals)).replace(/\.?0*$/g, '')
    const formattedParsedString = formatNumberWithCommas(parsedString) + (value.at(-1) === '.' ? '.' : '')
    let formattedParsedStringWithUnits
    if (unref(props.symbolPosition) === 'left')
      formattedParsedStringWithUnits = unref(props.symbol) + formattedParsedString
    else formattedParsedStringWithUnits = formattedParsedString + unref(props.symbol)

    if (masked.value !== formattedParsedStringWithUnits) masked.value = formattedParsedStringWithUnits

    const index = Array.from(masked.value).findIndex((char, index) => {
      const digitsAndDotBefore = Array.from(masked.value.slice(0, index + 1))
        .filter((char) => digitsAndDotRegex.test(char))
        .join('')
      return digitsAndDotBefore === digitsAndDotBeforeCursor
    })
    let newCursor = index !== -1 ? index + 1 : cursor
    if (masked.value.slice(newCursor) === '0') newCursor++

    preserveCursor &&
      nextTick(() => {
        input.setSelectionRange(newCursor, newCursor)
      })
  }

  return { masked, update }
}
