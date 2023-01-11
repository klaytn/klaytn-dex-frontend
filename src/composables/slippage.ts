import { SlippagePercent, parseSlippage } from '@/core/slippage'
import { numberToPercent } from '@/utils/common'
import { Ref } from 'vue'

const SLIPPAGE_PRECISION = 5

/**
 * Reactive writable slippage conversion between {@link SlippagePercent} and
 * its `number` representation
 */
export function useRawSlippage(defaultValue: SlippagePercent): {
  numeric: Ref<number>
  parsed: Ref<SlippagePercent>
} {
  const parsed = shallowRef(defaultValue)

  const numeric = computed<number>({
    get: () => {
      return parsed.value.quotient.toNumber()
    },
    set: (v) => {
      parsed.value = parseSlippage(numberToPercent(v, SLIPPAGE_PRECISION))
    },
  })

  return { parsed, numeric }
}
