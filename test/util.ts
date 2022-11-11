import type { Token } from '../src/core/types'
import { tokens } from '../dex-config.json'

/**
 * Fixed list of tokens for tests
 */
export const TOKENS_LIST = Object.freeze(tokens as Token[])
