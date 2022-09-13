import { MaybeRef } from '@vueuse/core'
import BigNumber from 'bignumber.js'
import invariant from 'tiny-invariant'
import { Except } from 'type-fest'
import { Ref } from 'vue'
import { formatNumberWithCommas } from './common'

type SymbolPosition = 'left' | 'right'

export interface UseCurrencyInputProps {
  writableModel: Ref<BigNumber>
  decimals: MaybeRef<number>
  symbol?: MaybeRef<MaskSymbol | null | undefined>
  input?: HTMLInputElement | Ref<null | HTMLInputElement>
}

export interface MaskSymbol {
  str: string
  position: SymbolPosition
  /**
   * @default ' '
   */
  delimiter?: string
}

export interface UseCurrencyInputReturn {
  inputRef: Ref<null | HTMLInputElement>
}

const ALLOWED_INPUT_REGEX = /^(?:(\d+)(\.\d*)?)?$/

function squashIntegerZeros(integer: string): string {
  for (let i = 0; i < integer.length; i++) {
    if (integer[i] !== '0') {
      if (i === 0) return integer
      return integer.slice(i)
    }
  }
  return '0'
}

function parseInputValue(input: string, decimals: number): { kind: 'NaN' } | { kind: 'ok'; num: string } {
  if (!input) return { kind: 'ok', num: '0' }
  const match = input.match(ALLOWED_INPUT_REGEX)
  if (!match) return { kind: 'NaN' }
  const [, integers, periodAndDecimals] = match as [string, string, string?]
  const integersWithFixedZeros = squashIntegerZeros(integers)
  return {
    kind: 'ok',
    num: integersWithFixedZeros + (periodAndDecimals?.slice(0, decimals + 1) ?? ''),
  }
}

if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest

  describe('parseInputValue()', () => {
    test('empty input', () => {
      expect(parseInputValue('', 5)).toEqual({ kind: 'ok', num: '0' })
    })

    test('0.', () => {
      expect(parseInputValue('0.', 5)).toEqual({ kind: 'ok', num: '0.' })
    })

    test('41234fffa1 is NaN', () => {
      expect(parseInputValue('41234fffa1', 5)).toEqual({ kind: 'NaN' })
    })

    test('00001 -> 1', () => {
      expect(parseInputValue('00001', 5)).toEqual({ kind: 'ok', num: '1' })
    })

    test('1.144000 without changes', () => {
      expect(parseInputValue('1.144000', 10)).toEqual({ kind: 'ok', num: '1.144000' })
    })

    test('1.144000 with decimals 3 -> 1.144', () => {
      expect(parseInputValue('1.144000', 3)).toEqual({ kind: 'ok', num: '1.144' })
    })

    test('00. -> 0.', () => {
      expect(parseInputValue('00.', 3)).toEqual({ kind: 'ok', num: '0.' })
    })
  })
}

function composeSymbol(sym: MaybeRef<MaskSymbol>): Except<MaskSymbol, 'delimiter'> {
  const { str, position, delimiter = ' ' } = unref(sym)
  return { position, str: position === 'left' ? str + delimiter : delimiter + str }
}

export function formatCurrency({ amount, symbol }: { amount: BigNumber; symbol?: MaskSymbol | null }) {
  const num = formatNumberWithCommas(amount)
  if (symbol) {
    const sym = composeSymbol(symbol)
    return sym.position === 'left' ? sym.str + num : num + sym.str
  } else return num
}

export function useFormattedCurrency(props: {
  amount: MaybeRef<BigNumber>
  symbol: MaybeRef<MaskSymbol | null | undefined>
}): Ref<string> {
  return computed(() => formatCurrency({ amount: unref(props.amount), symbol: unref(props.symbol) ?? null }))
}

class FocusedState {
  public readonly el: HTMLInputElement

  #lastInput = ''
  #amount: BigNumber | null = null

  public constructor(el: HTMLInputElement) {
    this.el = el
  }

  public get lastInput() {
    return this.#lastInput
  }

  public get amount() {
    invariant(this.#amount)
    return this.#amount
  }

  public update(amount: BigNumber, input: string) {
    const cursor = this.el.selectionStart
    this.#lastInput = this.el.value = input
    this.#amount = amount
    this.el.setSelectionRange(cursor, cursor)
  }

  public updateIfAmountDiffers(amount: BigNumber, input: string) {
    if (!this.#amount?.eq(amount)) this.update(amount, input)
  }

  public restoreInputValue() {
    this.el.value = this.#lastInput
  }
}

/**
 * # Notes
 *
 * Masked value will not be updated automatically when any of props is updated
 */
export function useCurrencyInput(props: UseCurrencyInputProps): UseCurrencyInputReturn {
  const model = props.writableModel

  const inputRef =
    props.input && isRef(props.input) ? props.input : shallowRef<null | HTMLInputElement>(props.input ?? null)

  const focused = shallowRef<FocusedState | null>(null)

  watch(
    inputRef,
    (el) => {
      if (el) {
        focused.value = document.activeElement === el ? new FocusedState(el) : null
      } else {
        focused.value = null
      }
    },
    { immediate: true },
  )

  const currencyFormatted = useFormattedCurrency({ amount: model, symbol: props.symbol })
  const currencyFixed = computed(() => model.value.decimalPlaces(unref(props.decimals)))
  const currencyFixedStr = computed(() => currencyFixed.value.toFixed())

  whenever(
    () => !currencyFixed.value.eq(model.value),
    () => {
      model.value = currencyFixed.value
    },
    { immediate: true },
  )

  watch(
    [focused, inputRef, currencyFixed, currencyFixedStr, currencyFormatted],
    ([focus, el, currAmount, currStr, currFmt]) => {
      if (focus) {
        focus.updateIfAmountDiffers(currAmount, currStr)
      } else if (el) {
        el.value = currFmt
      }
    },
    { immediate: true },
  )

  useEventListener(inputRef, 'focus', (evt) => {
    focused.value = new FocusedState(evt.target as HTMLInputElement)
  })

  useEventListener(inputRef, 'blur', () => {
    focused.value = null
  })

  useEventListener(inputRef, 'input', () => {
    const focusState = focused.value
    invariant(focusState)

    const input = focusState.el

    const inputRaw = input.value
    const inputParseResult = parseInputValue(inputRaw, unref(props.decimals))

    if (inputParseResult.kind === 'NaN') {
      focusState.restoreInputValue()
    } else {
      const { num } = inputParseResult

      // no NaN check because we believe that `num` is a number for sure
      const bignum = new BigNumber(num)

      if (
        // workaround unnecessary effects
        !model.value.eq(bignum)
      ) {
        model.value = bignum
      }

      focusState.update(model.value, num)
    }
  })

  return {
    inputRef,
  }
}
