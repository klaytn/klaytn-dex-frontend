import { MaybeRef } from '@vueuse/core'
import BigNumber from 'bignumber.js'
import invariant from 'tiny-invariant'
import { Except } from 'type-fest'
import { Ref } from 'vue'
import { formatNumberWithCommas } from './common'

type SymbolPosition = 'left' | 'right'

export interface UseCurrencyInputProps {
  writableModel: Ref<BigNumber>
  symbol: MaybeRef<MaskSymbol>
  decimals: MaybeRef<number>
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

function composeSymbol(sym: MaybeRef<MaskSymbol>): Except<MaskSymbol, 'delimiter'> {
  const { str, position, delimiter = ' ' } = unref(sym)
  return { position, str: position === 'left' ? str + delimiter : delimiter + str }
}

export function useFormattedCurrency({
  amount,
  symbol,
}: {
  amount: MaybeRef<BigNumber>
  symbol: MaybeRef<MaskSymbol>
}): Ref<string> {
  return computed(() => {
    const num = formatNumberWithCommas(unref(amount))
    const sym = composeSymbol(unref(symbol))
    return sym.position === 'left' ? sym.str + num : num + sym.str
  })
}

function trimLeadingZeros(input: string): string {
  return input.replace(/^0*([^0])/, '$1')
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
    this.#lastInput = this.el.value = input
    this.#amount = amount
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
    const inputValue = input.value || '0'
    const inputValueParsed = new BigNumber(inputValue)

    if (inputValueParsed.isNaN()) {
      focusState.restoreInputValue()
    } else {
      // workaround unnecessary effects
      const inputValueParsedFixed = inputValueParsed.decimalPlaces(unref(props.decimals))
      if (!model.value.eq(inputValueParsed) && inputValueParsed.eq(inputValueParsedFixed)) {
        model.value = inputValueParsed
      }

      const inputValueProcessed = trimLeadingZeros(inputValue)
      focusState.update(model.value, inputValueProcessed)
    }
  })

  return {
    inputRef,
  }
}
