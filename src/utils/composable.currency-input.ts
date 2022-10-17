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

export const SYMBOL_USD = { str: '$', position: 'left', delimiter: '' } as const

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

function composeSymbol(sym: MaybeRef<MaskSymbol>): Except<MaskSymbol, 'delimiter'> {
  const { str, position, delimiter = ' ' } = unref(sym)
  return { position, str: position === 'left' ? str + delimiter : delimiter + str }
}

function trimTrailingZerosWithPeriod(input: string): string {
  let firstNonZeroIndex: undefined | number
  let periodIndex: undefined | number
  for (let i = input.length - 1, char = input[i]; i > 0; i--, char = input[i]) {
    if (char === '.') {
      periodIndex = i
      break
    }
    if (!firstNonZeroIndex && char !== '0') firstNonZeroIndex = i
  }
  return periodIndex ? (firstNonZeroIndex ? input.slice(0, firstNonZeroIndex + 1) : input.slice(0, periodIndex)) : input
}

export function formatCurrency({
  amount,
  symbol,
  decimals,
}: {
  amount: BigNumber | string | number
  symbol?: MaskSymbol | null
  decimals?: number
}) {
  const rounded = typeof decimals === 'number' ? new BigNumber(amount).toFixed(decimals) : amount
  let num = formatNumberWithCommas(rounded)
  num = trimTrailingZerosWithPeriod(num)
  if (symbol) {
    const sym = composeSymbol(symbol)
    return sym.position === 'left' ? sym.str + num : num + sym.str
  } else return num
}

export function useFormattedCurrency(props: {
  amount: MaybeRef<BigNumber | number | string>
  symbol?: MaybeRef<MaskSymbol | null | undefined>
  decimals?: MaybeRef<number>
}): Ref<string> {
  return computed(() =>
    formatCurrency({
      amount: unref(props.amount),
      symbol: unref(props.symbol) ?? null,
      decimals: unref(props.decimals),
    }),
  )
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
    if (cursor === 0) this.el.setSelectionRange(input.length, input.length)
    else this.el.setSelectionRange(cursor, cursor)
  }

  public updateIfAmountDiffers(amount: BigNumber, input: string) {
    if (!this.#amount?.eq(amount)) this.update(amount, input)
  }

  public restoreInputValue() {
    this.el.value = this.#lastInput
  }
}

/**
 * Useful when the actual model could be not immediately updated on set.
 * The model returned by this function updates immediately
 */
function useBigNumModelReplication(model: Ref<BigNumber>): Ref<BigNumber> {
  const replica = shallowRef(model.value)

  const proxy = computed({
    get: () => replica.value,
    set: (v) => {
      replica.value = model.value = v
    },
  })

  watch(
    model,
    (v) => {
      if (!v.eq(replica.value)) replica.value = v
    },
    { flush: 'sync' },
  )

  return proxy
}

export function useCurrencyInput(props: UseCurrencyInputProps): UseCurrencyInputReturn {
  const model = useBigNumModelReplication(props.writableModel)

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

if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest

  describe('parseInputValue()', () => {
    test.each([
      ['', 5, { kind: 'ok', num: '0' }],
      ['0.', 5, { kind: 'ok', num: '0.' }],
      ['41234fffa1', 5, { kind: 'NaN' }],
      ['00001', 5, { kind: 'ok', num: '1' }],
      ['1.144000', 10, { kind: 'ok', num: '1.144000' }],
      ['1.144000', 3, { kind: 'ok', num: '1.144' }],
      ['00.', 3, { kind: 'ok', num: '0.' }],
    ])('Parses %o with decimals %o into %o', (input, decimals, result) => {
      expect(parseInputValue(input, decimals)).toEqual(result)
    })
  })

  describe('formatCurrency()', () => {
    test.each([
      [{ amount: '1234432' }, '1,234,432'],
      [{ amount: 1_555_222.4123 }, '1,555,222.4123'],
      [{ amount: 1.444000111, decimals: 7 }, '1.4440001'],
      [{ amount: 1.444000199, decimals: 7 }, '1.4440002'],
      [
        {
          amount: new BigNumber('1.751554358495751722150827385409601564116127291004119659134e+22'),
          decimals: 2,
          symbol: { str: '$', position: 'left' as const, delimiter: '' },
        },
        '$17,515,543,584,957,517,221,508.27',
      ],
      [{ amount: 10, decimals: 2 }, '10'],
    ])('Formats %o into %s', (input, output) => {
      expect(formatCurrency(input)).toEqual(output)
    })
  })

  describe('Trim trailing zeros', () => {
    test.each([
      ['0.0', '0'],
      ['12230000', '12230000'],
      ['1.2000', '1.2'],
      ['0', '0'],
      ['7.001', '7.001'],
      ['1.00000', '1'],
    ])('%o is trimmed into %o', (a, b) => {
      expect(trimTrailingZerosWithPeriod(a)).toEqual(b)
    })
  })
}
