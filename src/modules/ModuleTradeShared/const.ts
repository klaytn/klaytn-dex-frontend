import { Percent } from '@/core'
import { parseSlippage } from '@/core/slippage'

export const DEFAULT_SLIPPAGE_TOLERANCE = parseSlippage(new Percent(5, 1000))
