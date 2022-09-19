import { Address, TokenSymbol, WeiAsToken } from '@/core'
import { useLazyQuery } from '@vue/apollo-composable'
import { MaybeRef } from '@vueuse/core'
import gql from 'graphql-tag'
import { Opaque } from 'type-fest'
import { Ref } from 'vue'
import { byValue, byString } from 'sort-es'
import { ApolloClientId } from '@/types'
import { TokensPair } from '@/utils/pair'

export type TimestampEpochSec = Opaque<string, 'timestamp-unix-epoch-sec'>

/**
 * It is like address, but with a suffix
 * @example '0x7825af8d514b722b21a387401db0c2d635758e0ba987eb775f4ae0db84214a08-0'
 */
export type TransactionId = Opaque<string, 'tx-id'>

type StringAmount = WeiAsToken<string>

export interface Swap {
  id: TransactionId
  timestamp: TimestampEpochSec
  amount0In: StringAmount
  amount1Out: StringAmount
  amount0Out: StringAmount
  amount1In: StringAmount
  pair: PairRaw
}

interface PairRaw {
  id: Address
  token0: PairTokenRaw
  token1: PairTokenRaw
}

interface PairTokenRaw {
  id: Address
  name: string
  symbol: TokenSymbol
  decimals: string
}

interface MintBurnCommon {
  id: TransactionId
  timestamp: TimestampEpochSec
  liquidity: StringAmount
  amount0: StringAmount
  amount1: StringAmount
  pair: PairRaw
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Mint extends MintBurnCommon {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Burn extends MintBurnCommon {}

export interface TransactionsQueryResult {
  swaps: Swap[]
  mints: Mint[]
  burns: Burn[]
}

export function useTransactionsQuery(props: {
  account: MaybeRef<null | Address>
  /**
   * How do we implement fuzzy search?
   */
  // search: MaybeRef<string | null>
}) {
  const LIMIT = 10
  let offset = 0

  const { result, loading, fetchMore, load } = useLazyQuery<TransactionsQueryResult>(
    gql`
      query TransactionsQuery($userId: String!, $offset: Int, $limit: Int) {
        swaps(where: { from: $userId }, orderBy: timestamp, orderDirection: desc, offset: $offset, limit: $limit) {
          id
          timestamp
          amount0In
          amount1Out
          amount0Out
          amount1In
          pair {
            token0 {
              id
              name
              symbol
              decimals
            }
            token1 {
              id
              name
              symbol
              decimals
            }
            id
          }
        }
        mints(where: { to: $userId }, orderBy: timestamp, orderDirection: desc, offset: $offset, limit: $limit) {
          timestamp
          id
          amount1
          amount0
          liquidity
          pair {
            token0 {
              id
              name
              symbol
              decimals
            }
            token1 {
              id
              name
              symbol
              decimals
            }
            id
          }
        }
        burns(where: { sender: $userId }, orderBy: timestamp, orderDirection: desc, offset: $offset, limit: $limit) {
          timestamp
          id
          amount1
          amount0
          liquidity
          pair {
            token0 {
              id
              name
              symbol
              decimals
            }
            token1 {
              id
              name
              symbol
              decimals
            }
            id
          }
        }
      }
    `,
    () => ({
      userId: unref(props.account),
      limit: LIMIT,
    }),
    () => ({
      enabled: !!unref(props.account),
      clientId: ApolloClientId.Exchange,
    }),
  )

  return {
    load,
    result,
    loading,
    fetchMore: () => {
      offset += LIMIT
      fetchMore({
        variables: { offset },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev
          return {
            swaps: [...prev.swaps, ...fetchMoreResult.swaps],
            mints: [...prev.mints, ...fetchMoreResult.mints],
            burns: [...prev.burns, ...fetchMoreResult.burns],
          }
        },
      })
    },
  }
}

export type TransactionEnum = ({ kind: 'swap' } & Swap) | ({ kind: 'mint' } & Mint) | ({ kind: 'burn' } & Burn)

export function useTransactionEnum(
  result: Ref<null | undefined | TransactionsQueryResult>,
): Ref<null | TransactionEnum[]> {
  return computed(() => {
    const resultValue = result.value
    if (!resultValue) return null

    const items = [
      ...resultValue.swaps.map<TransactionEnum>((x) => ({ kind: 'swap', ...x })),
      ...resultValue.mints.map<TransactionEnum>((x) => ({ kind: 'mint', ...x })),
      ...resultValue.burns.map<TransactionEnum>((x) => ({ kind: 'burn', ...x })),
    ]

    items.sort(byValue('timestamp', byString())).reverse()

    return items
  })
}

type SwapAmounts = Pick<Swap, 'amount0In' | 'amount0Out' | 'amount1In' | 'amount1Out'>

type ParsedAmounts = Record<'in' | 'out', ParsedAmountByToken>

type Token01 = 'token0' | 'token1'

interface ParsedAmountByToken {
  token: Token01
  amount: StringAmount
}

function eitherNonZeroAmount(amounts: Record<Token01, StringAmount>): ParsedAmountByToken {
  if (amounts.token0 !== '0')
    if (amounts.token1 !== '0') throw new Error('Both amounts cannot be non-zeros')
    else return { token: 'token0', amount: amounts.token0 }
  else return { token: 'token1', amount: amounts.token1 }
}

export function parseSwapAmounts(tx: SwapAmounts): ParsedAmounts {
  return {
    in: eitherNonZeroAmount({ token0: tx.amount0In, token1: tx.amount1In }),
    out: eitherNonZeroAmount({ token0: tx.amount0Out, token1: tx.amount1Out }),
  }
}

if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest

  const defineResult = (x: ParsedAmounts) => x
  const amount = (raw: string) => raw as StringAmount

  describe('Parsing swap amounts', () => {
    test('when amount1In and amount0Out are specified, returns them', () => {
      expect(
        parseSwapAmounts({
          amount0In: amount('0'),
          amount0Out: amount('1.001592148574531527'),
          amount1In: amount('1'),
          amount1Out: amount('0'),
        }),
      ).toEqual(
        defineResult({
          in: { token: 'token1', amount: amount('1') },
          out: { token: 'token0', amount: amount('1.001592148574531527') },
        }),
      )
    })

    test('when amount1In and amount0Out are specified, returns them', () => {
      expect(
        parseSwapAmounts({
          amount0In: amount('1'),
          amount0Out: amount('0'),
          amount1In: amount('0'),
          amount1Out: amount('0.99242138129335352'),
        }),
      ).toEqual(
        defineResult({
          in: { token: 'token0', amount: amount('1') },
          out: { token: 'token1', amount: amount('0.99242138129335352') },
        }),
      )
    })

    test('when amount0In and amount0Out are specified, returns them', () => {
      expect(
        parseSwapAmounts({
          amount0In: amount('1'),
          amount0Out: amount('0.99242138129335352'),
          amount1In: amount('0'),
          amount1Out: amount('0'),
        }),
      ).toEqual(
        defineResult({
          in: { token: 'token0', amount: amount('1') },
          out: { token: 'token0', amount: amount('0.99242138129335352') },
        }),
      )
    })

    test('when amount0In and amount1In are specified, throws an error', () => {
      expect(() =>
        parseSwapAmounts({
          amount0In: amount('1'),
          amount0Out: amount('0.99242138129335352'),
          amount1In: amount('1'),
          amount1Out: amount('0'),
        }),
      ).toThrow()
    })
  })
}
