import { Address, Wei } from '@/core'
import BigNumber from 'bignumber.js'
import escapeStringRegexp from 'escape-string-regexp'
import { Ref } from 'vue'
import { BLOCKS_PER_YEAR } from './const'
import { PoolsQueryResult } from './query.pools'
import { AmountInUSD, PercentageRate, Pool, Rewards, Sorting, TokenPriceInUSD } from './types'
import { Tokens } from '@/query/tokens-derived-usd'
import invariant from 'tiny-invariant'

export function useMappedPools(props: {
  pools: Ref<undefined | null | PoolsQueryResult>
  rewards: Ref<undefined | null | Rewards<Address>>
  tokens: Ref<undefined | null | Tokens>
  blockNumber: Ref<number | null>
}) {
  const sortedBlockNumbers = computed(() => {
    const {
      pools: { value: poolsResult },
    } = props
    if (!poolsResult) return null

    const blockNumbers = poolsResult.pools
      .map((pool) => [Number(pool.endBlock), Number(pool.startBlock) + Number(pool.blocksForUserLimit)])
      .flat()

    return blockNumbers.sort((a, b) => b - a)
  })

  // Needed to avoid unnecessary recalculations in main computed function
  const roundedBlockNumber = computedEager(() => {
    const {
      blockNumber: { value: blockNumber },
    } = props
    const blocks = sortedBlockNumbers.value
    if (!blocks?.length || !blockNumber) return null
    let rounded = blockNumber
    blocks.forEach((block) => {
      if (block >= blockNumber) rounded = block
    })
    return rounded
  })

  return computed((): null | Pool[] => {
    const {
      pools: { value: poolsResult },
      rewards: { value: rewards },
      tokens: { value: tokens },
    } = props
    if (!poolsResult || !tokens) return null

    let mappedPools = [] as Pool[]

    for (const pool of poolsResult.pools) {
      const id = pool.id

      const startBlock = Number(pool.startBlock)
      const endBlock = Number(pool.endBlock)
      const active = (roundedBlockNumber.value ?? 0) <= endBlock

      const reward = rewards?.get(pool.id) ?? null
      const earned = reward ? reward.decimals(pool.rewardToken) : null

      const stakeToken = {
        ...pool.stakeToken,
        decimals: Number(pool.stakeToken.decimals),
      }
      const rewardToken = {
        ...pool.rewardToken,
        decimals: Number(pool.rewardToken.decimals),
      }

      const staked = new Wei(pool.users[0]?.amount ?? '0').decimals(pool.stakeToken)

      const stakeTokenFromTokensQuery = tokens.find((token) => token.id === pool.stakeToken.id)
      const rewardTokenFromTokensQuery = tokens.find((token) => token.id === pool.rewardToken.id)

      const stakeTokenPrice = stakeTokenFromTokensQuery
        ? (new BigNumber(stakeTokenFromTokensQuery.derivedUSD) as TokenPriceInUSD)
        : null
      const rewardTokenPrice = rewardTokenFromTokensQuery
        ? (new BigNumber(rewardTokenFromTokensQuery.derivedUSD) as TokenPriceInUSD)
        : null

      const totalTokensStaked = new Wei(pool.totalTokensStaked).decimals(stakeToken)
      const totalStaked = (stakeTokenPrice?.times(totalTokensStaked) as AmountInUSD) ?? null

      const rewardRate = new BigNumber(pool.rewardRate)
      const totalRewardPricePerYear = rewardTokenPrice
        ? rewardRate.times(BLOCKS_PER_YEAR).times(rewardTokenPrice)
        : null
      const annualPercentageRate =
        totalRewardPricePerYear && active
          ? (totalRewardPricePerYear.div(totalStaked.isZero() ? 1 : totalStaked).times(100) as PercentageRate)
          : null

      const createdAtBlock = Number(pool.createdAtBlock)

      const blocksForUserLimit = Number(pool.blocksForUserLimit)
      const userLimitEndBlock = startBlock + blocksForUserLimit
      const isUserLimitActive = (roundedBlockNumber.value ?? 0) <= userLimitEndBlock
      const userLimit = isUserLimitActive ? new Wei(pool.userLimit).decimals(pool.stakeToken) : null

      mappedPools.push({
        id,
        stakeToken,
        rewardToken,
        earned,
        staked,
        userLimit,
        userLimitEndBlock,
        stakeTokenPrice,
        createdAtBlock,
        annualPercentageRate,
        totalStaked,
        startBlock,
        endBlock,
        active,
      })
    }

    return mappedPools
  })
}

export function useFilteredPools<T extends Pool>(
  pools: Ref<null | T[]>,
  filters: {
    stakedOnly: Ref<boolean>
    searchQuery: Ref<string>
  },
): Ref<null | T[]> {
  return computed(() => {
    const items = pools.value
    if (!items) return null

    const searchQuery = filters.searchQuery.value
      ? new RegExp(escapeStringRegexp(filters.searchQuery.value), 'i')
      : null

    const stakedOnly = filters.stakedOnly.value

    return items.filter((x) => {
      if (stakedOnly && x.staked.isZero()) return false
      if (searchQuery) {
        if (
          ![x.stakeToken.symbol, x.stakeToken.name, x.rewardToken.symbol, x.rewardToken.name].some((item) =>
            searchQuery.test(item),
          )
        )
          return false
      }
      return true
    })
  })
}

function comparePools<T extends Pool>(poolA: T, poolB: T, sorting: Sorting): number {
  switch (sorting) {
    case Sorting.Hot:
      if (poolA.active && !poolB.active) return -1
      if (poolB.active && !poolA.active) return 1
      if (!poolB.annualPercentageRate || !poolA.annualPercentageRate) return 0
      return poolB.annualPercentageRate.comparedTo(poolA.annualPercentageRate)
    case Sorting.AnnualPercentageRate:
      if (!poolB.annualPercentageRate || !poolA.annualPercentageRate) return 0
      return poolB.annualPercentageRate.comparedTo(poolA.annualPercentageRate)
    case Sorting.Earned:
      invariant(poolB.earned && poolA.earned)
      return poolB.earned.comparedTo(poolA.earned)
    case Sorting.TotalStaked:
      return poolB.totalStaked.comparedTo(poolA.totalStaked)
    case Sorting.Latest:
      return poolB.createdAtBlock - poolA.createdAtBlock
    default:
      return 0
  }
}

export function useSortedPools(pools: Ref<Pool[] | null>, sort: Ref<Sorting>) {
  const sorted = computed<Pool[] | null>(() => {
    if (!pools.value) return null
    const sorting = sort.value

    const list = [...pools.value]
    list.sort((a, b) => comparePools(a, b, sorting))
    return list
  })

  return sorted
}
