import { Address, CurrencySymbol, WeiAsToken } from '@/core'
import { useLazyQuery } from '@vue/apollo-composable'
import { MaybeRef } from '@vueuse/core'
import gql from 'graphql-tag'
import { Opaque } from 'type-fest'
import { Ref } from 'vue'
import { byString, byValue } from 'sort-es'
import { ApolloClientId } from '@/types'
import { ITEM_HEIGHT, WRAP_HEIGHT } from './const'

export type TimestampEpochSec = Opaque<string, 'timestamp-unix-epoch-sec'>

/**
 * It is like address, but with a suffix
 * @example '0x7825af8d514b722b21a387401db0c2d635758e0ba987eb775f4ae0db84214a08-0'
 */
export type SwapId = Opaque<string, 'swap-id'>

export type MintId = Opaque<string, 'mint-id'>

export type BurnId = Opaque<string, 'burn-id'>

type StringAmount = WeiAsToken<string>

export interface FragmentSwap {
  id: SwapId
  timestamp: TimestampEpochSec
  amount0In: StringAmount
  amount1Out: StringAmount
  amount0Out: StringAmount
  amount1In: StringAmount
  pair: FragmentPair
  transaction: FragmentTransaction
}

interface FragmentPair {
  id: Address
  token0: FragmentToken
  token1: FragmentToken
}

interface FragmentToken {
  id: Address
  name: string
  symbol: CurrencySymbol
  decimals: string
}

interface MintBurnCommon {
  timestamp: TimestampEpochSec
  liquidity: StringAmount
  amount0: StringAmount
  amount1: StringAmount
  pair: FragmentPair
  transaction: FragmentTransaction
}

export interface FragmentMint extends MintBurnCommon {
  id: MintId
}

export interface FragmentBurn extends MintBurnCommon {
  id: BurnId
}

interface FragmentTransaction {
  id: Address
}

export interface TransactionsQueryResult {
  swaps: FragmentSwap[]
  mints: FragmentMint[]
  burns: FragmentBurn[]
}

const LIMIT = Math.ceil(WRAP_HEIGHT / ITEM_HEIGHT)

const FRAGMENT_PAIR = gql`
  fragment pair on Pair {
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
`

const FRAGMENT_SWAP = gql`
  fragment fragmentSwap on Swap {
    id
    timestamp
    amount0In
    amount1Out
    amount0Out
    amount1In
    pair {
      ...pair
    }
    transaction {
      id
    }
  }
  ${FRAGMENT_PAIR}
`

const FRAGMENT_MINT = gql`
  fragment mint on Mint {
    timestamp
    id
    amount1
    amount0
    liquidity
    pair {
      ...pair
    }
    transaction {
      id
    }
  }
  ${FRAGMENT_PAIR}
`

const FRAGMENT_BURN = gql`
  fragment burn on Burn {
    timestamp
    id
    amount1
    amount0
    liquidity
    pair {
      ...pair
    }
    transaction {
      id
    }
  }
  ${FRAGMENT_PAIR}
`

export function useTransactionsQueryByAccount(props: { account: MaybeRef<null | Address> }) {
  let first = LIMIT

  const { result, loading, fetchMore, load, refetch } = useLazyQuery<TransactionsQueryResult>(
    gql`
      query TransactionsQuery($userId: String!, $first: Int!) {
        swaps(where: { from: $userId }, orderBy: timestamp, orderDirection: desc, first: $first) {
          ...fragmentSwap
        }
        mints(where: { to: $userId }, orderBy: timestamp, orderDirection: desc, first: $first) {
          ...mint
        }
        burns(where: { sender: $userId }, orderBy: timestamp, orderDirection: desc, first: $first) {
          ...burn
        }
      }
      ${FRAGMENT_SWAP}
      ${FRAGMENT_MINT}
      ${FRAGMENT_BURN}
    `,
    () => ({
      userId: unref(props.account),
      first,
    }),
    () => ({
      enabled: !!unref(props.account),
      clientId: ApolloClientId.Exchange,
    }),
  )

  return {
    refetch,
    load,
    enumerated: useTransactionEnum(result),
    loading,
    fetchMore: () => {
      first += LIMIT
      fetchMore({
        variables: { first },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev
          return fetchMoreResult
        },
      })
    },
  }
}

export type TransactionEnum =
  | ({ kind: 'swap' } & FragmentSwap)
  | ({ kind: 'mint' } & FragmentMint)
  | ({ kind: 'burn' } & FragmentBurn)

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

type SwapAmounts = Pick<FragmentSwap, 'amount0In' | 'amount0Out' | 'amount1In' | 'amount1Out'>

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
