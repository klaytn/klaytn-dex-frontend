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

class FocusedState {
  public readonly el: HTMLInputElement
  public lastFineInput = ''

  public constructor(el: HTMLInputElement) {
    this.el = el
  }
}

/**
 * # Notes
 *
 * Masked value will not be updated automatically when any of props is updated
 */
export function useCurrencyInput(props: UseCurrencyInputProps): UseCurrencyInputReturn {
  const model = props.writableModel

  const inputRef = shallowRef<null | HTMLInputElement>(null)
  const focused = shallowRef<FocusedState | null>(null)

  watch(inputRef, (el) => {
    if (el) {
      focused.value = document.activeElement === el ? new FocusedState(el) : null
    } else {
      focused.value = null
    }
  })

  const currencyFormatted = computed(() => {
    const num = formatNumberWithCommas(model.value)
    const sym = composeSymbol(props.symbol)
    return sym.position === 'left' ? sym.str + num : num + sym.str
  })

  const currencyValue = computed(() => model.value.toFixed())

  watch(
    [focused, inputRef, currencyValue, currencyFormatted],
    ([focus, el, currVal, currFmt]) => {
      if (focus) {
        invariant(el)
        el.value = focus.lastFineInput = currVal
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
      // set input value to last fine value
      input.value = focusState.lastFineInput
    } else {
      // update value & last fine value
      // do not touch input value

      // workaround unnecessary effects
      if (!model.value.eq(inputValueParsed)) {
        model.value = inputValueParsed
      }

      const inputValueProcessed = inputValue.replace(/^0*([^0])/, '$1')
      focusState.lastFineInput = input.value = inputValueProcessed
    }
  })

  return {
    inputRef,
  }
}
