import BigNumber from 'bignumber.js'
import type { Opaque } from 'type-fest'
import type { PoolId, TokenSymbol, WeiAsToken } from '@/core'
import type { Rewards } from '@/core/domain/earn'
import type { TokensPair } from '@/utils/pair'

export { PoolId, Rewards }

export const ModalOperation = {
  Stake: 'stake',
  Unstake: 'unstake',
} as const

export type ModalOperation = typeof ModalOperation[keyof typeof ModalOperation]

type AsyncAmountFn = (amount: WeiAsToken<BigNumber>) => Promise<void>

export type ModalOperationComposite = ModalOperationCompositeBase &
  (
    | {
        kind: 'stake'
        stake: AsyncAmountFn
      }
    | {
        kind: 'unstake'
        unstake: AsyncAmountFn
      }
  )

export interface ModalOperationCompositeBase {
  symbols: TokensPair<TokenSymbol>
  staked: WeiAsToken<BigNumber>
  balance: WeiAsToken<BigNumber>
}

/**
 * It is a price of one WeiAsToken in USD.
 */
export type TokenPriceInUSD<T extends BigNumber | string = BigNumber> = Opaque<T, 'TokenValue'>

/**
 * It is a price of some amount of WeiAsToken in USD.
 */
export type AmountInUSD<T extends BigNumber | string = BigNumber> = Opaque<T, 'TokenValue'>

/**
 * It is a percentage rate of something (APR or APY for example): [0 - 100]
 */
export type PercentageRate<T extends BigNumber | string = BigNumber> = Opaque<T, 'TokenValue'>
