import { Address, TokenSymbol, WeiAsToken } from '@/core'
import { useLazyQuery } from '@vue/apollo-composable'
import { MaybeRef } from '@vueuse/core'
import gql from 'graphql-tag'
import { Opaque } from 'type-fest'
import { Ref } from 'vue'
import { byValue, byString } from 'sort-es'
import { ApolloClientId } from '@/types'
import { TokensPair } from '@/utils/pair'
import { DocumentNode } from '@apollo/client/core'

export type TimestampEpochSec = Opaque<string, 'timestamp-unix-epoch-sec'>

/**
 * It is like address, but with a suffix
 * @example '0x7825af8d514b722b21a387401db0c2d635758e0ba987eb775f4ae0db84214a08-0'
 */
export type TransactionId = Opaque<string, 'tx-id'>

type StringAmount = WeiAsToken<string>

export interface FragmentSwap {
  id: TransactionId
  timestamp: TimestampEpochSec
  amount0In: StringAmount
  amount1Out: StringAmount
  amount0Out: StringAmount
  amount1In: StringAmount
  pair: FragmentPair
}

interface FragmentPair {
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
  pair: FragmentPair
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FragmentMint extends MintBurnCommon {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FragmentBurn extends MintBurnCommon {}

export interface TransactionsQueryResult {
  swaps: FragmentSwap[]
  mints: FragmentMint[]
  burns: FragmentBurn[]
}

const LIMIT = 10

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
  }
  ${FRAGMENT_PAIR}
`

export function useTransactionsQueryByAccount(props: { account: MaybeRef<null | Address> }) {
  let offset = 0

  const { result, loading, fetchMore, load } = useLazyQuery<TransactionsQueryResult>(
    gql`
      query TransactionsQuery($userId: String!, $offset: Int, $limit: Int) {
        swaps(where: { from: $userId }, orderBy: timestamp, orderDirection: desc, offset: $offset, limit: $limit) {
          ...fragmentSwap
        }
        mints(where: { to: $userId }, orderBy: timestamp, orderDirection: desc, offset: $offset, limit: $limit) {
          ...mint
        }
        burns(where: { sender: $userId }, orderBy: timestamp, orderDirection: desc, offset: $offset, limit: $limit) {
          ...burn
        }
      }
      ${FRAGMENT_SWAP}
      ${FRAGMENT_MINT}
      ${FRAGMENT_BURN}
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
    enumerated: useTransactionEnum(result),
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

// FIXME does not work
export function useTransactionsQueryByAccountAndAsset(props: {
  account: MaybeRef<null | Address>
  asset: MaybeRef<null | Address>
}) {
  let offset = 0

  const variables = () => ({
    account: unref(props.account),
    asset: unref(props.account),
    limit: LIMIT,
  })

  const options = () => ({
    enabled: !!unref(props.account),
    clientId: ApolloClientId.Exchange,
  })

  const queryFactory = <T>(doc: DocumentNode) => useLazyQuery<T>(doc, variables, options)

  const queries = {
    swapsLeft: queryFactory<Pick<TransactionsQueryResult, 'swaps'>>(gql`
      query SwapsLeft($account: String!, $asset: String!, $offset: Int, $limit: Int) {
        swaps(
          where: { from: $account, pair: { token0: { id: $asset } } }
          orderBy: timestamp
          orderDirection: desc
          offset: $offset
          limit: $limit
        ) {
          ...fragmentSwap
        }
      }
      ${FRAGMENT_SWAP}
    `),
    swapsRight: queryFactory<Pick<TransactionsQueryResult, 'swaps'>>(gql`
      query SwapsRight($account: String!, $asset: String!, $offset: Int, $limit: Int) {
        swaps(
          where: { from: $account, pair: { token1: { id: $asset } } }
          orderBy: timestamp
          orderDirection: desc
          offset: $offset
          limit: $limit
        ) {
          ...fragmentSwap
        }
      }
      ${FRAGMENT_SWAP}
    `),
    mintsLeft: queryFactory<Pick<TransactionsQueryResult, 'mints'>>(gql`
      query MintsLeft($account: String!, $asset: String!, $offset: Int, $limit: Int) {
        mints(
          where: { from: $account, pair: { token0: { id: $asset } } }
          orderBy: timestamp
          orderDirection: desc
          offset: $offset
          limit: $limit
        ) {
          ...mint
        }
      }
      ${FRAGMENT_MINT}
    `),
    mintsRight: queryFactory<Pick<TransactionsQueryResult, 'mints'>>(gql`
      query MintsRight($account: String!, $asset: String!, $offset: Int, $limit: Int) {
        mints(
          where: { from: $account, pair: { token1: { id: $asset } } }
          orderBy: timestamp
          orderDirection: desc
          offset: $offset
          limit: $limit
        ) {
          ...mint
        }
      }
      ${FRAGMENT_MINT}
    `),
    burnsLeft: queryFactory<Pick<TransactionsQueryResult, 'burns'>>(gql`
      query MintsLeft($account: String!, $asset: String!, $offset: Int, $limit: Int) {
        burns(
          where: { from: $account, pair: { token0: { id: $asset } } }
          orderBy: timestamp
          orderDirection: desc
          offset: $offset
          limit: $limit
        ) {
          ...burn
        }
      }
      ${FRAGMENT_BURN}
    `),
    burnsRight: queryFactory<Pick<TransactionsQueryResult, 'burns'>>(gql`
      query MintsRight($account: String!, $asset: String!, $offset: Int, $limit: Int) {
        burns(
          where: { from: $account, pair: { token1: { id: $asset } } }
          orderBy: timestamp
          orderDirection: desc
          offset: $offset
          limit: $limit
        ) {
          ...mint
        }
      }
      ${FRAGMENT_BURN}
    `),
  }

  const queriesEnum = Object.values(queries)

  const loading = logicOr(queriesEnum.map((x) => x.loading))

  const mergedResult = computed<null | TransactionsQueryResult>(() => {
    const swaps = mergeListsOrNull(queries.swapsLeft.result.value?.swaps, queries.swapsRight.result.value?.swaps)
    const mints = mergeListsOrNull(queries.mintsLeft.result.value?.mints, queries.mintsRight.result.value?.mints)
    const burns = mergeListsOrNull(queries.burnsLeft.result.value?.burns, queries.burnsRight.result.value?.burns)
    return swaps && mints && burns && { swaps, mints, burns }
  })

  const enumerated = useTransactionEnum(mergedResult)

  function fetchMore() {
    offset += LIMIT

    for (const { fetchMore } of [queries.swapsLeft, queries.swapsRight]) {
      fetchMore({
        variables: { offset },
        updateQuery(prev, { fetchMoreResult }) {
          if (!fetchMoreResult) return prev
          return {
            swaps: [...prev.swaps, ...fetchMoreResult.swaps],
          }
        },
      })
    }

    for (const { fetchMore } of [queries.mintsLeft, queries.mintsRight]) {
      fetchMore({
        variables: { offset },
        updateQuery(prev, { fetchMoreResult }) {
          if (!fetchMoreResult) return prev
          return {
            mints: [...prev.mints, ...fetchMoreResult.mints],
          }
        },
      })
    }

    for (const { fetchMore } of [queries.burnsLeft, queries.burnsRight]) {
      fetchMore({
        variables: { offset },
        updateQuery(prev, { fetchMoreResult }) {
          if (!fetchMoreResult) return prev
          return {
            burns: [...prev.burns, ...fetchMoreResult.burns],
          }
        },
      })
    }
  }

  function load() {
    for (const x of queriesEnum) x.load()
  }

  return { load, loading, fetchMore, enumerated }
}

function mergeListsOrNull<T>(...lists: (T[] | null | undefined)[]): null | T[] {
  const merged: T[] = []

  for (const list of lists) {
    if (!list) return null
    merged.push(...list)
  }

  return merged
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
    console.log({ resultValue })

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
