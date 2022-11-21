import { Wei, WeiAsToken } from '@/core'
import BigNumber from 'bignumber.js'
import escapeStringRegexp from 'escape-string-regexp'
import invariant from 'tiny-invariant'
import { Ref } from 'vue'
import { BLOCKS_PER_YEAR } from './const'
import { FarmingQueryResult } from './query.farming'
import { PairsAndRewardTokenQueryResult } from './query.pairs-and-reward-token'
import { PercentageRate, Pool, PoolId, Rewards, Sorting, TokenPriceInUSD } from './types'
import { farmingFromWei } from './utils'

export function useMappedPools(props: {
  blockNumber: Ref<undefined | null | number>
  pairsAndRewardToken: Ref<undefined | null | PairsAndRewardTokenQueryResult>
  farming: Ref<undefined | null | FarmingQueryResult>
  rewards: Ref<undefined | null | Rewards<PoolId>>
}) {
  return computed((): null | Pool[] => {
    const {
      farming: { value: farmingResult },
      blockNumber: { value: blockNumber },
      pairsAndRewardToken: { value: pairsAndRewardToken },
      rewards: { value: rewards },
    } = props
    if (!farmingResult || !blockNumber || !pairsAndRewardToken) return null
    const { token: rewardToken, pairs } = pairsAndRewardToken
    const { farming } = farmingResult

    let pools = [] as Pool[]

    for (const pool of farming.pools) {
      const id = pool.id
      const pair = pairs.find((pair) => pair.id === pool.pair) ?? null

      const reward = rewards?.get(pool.id) ?? null
      const earned = reward ? farmingFromWei(reward) : null

      if (pair === null) continue

      const pairId = pair.id
      const name = pair.name

      const staked = farmingFromWei(new Wei(pool.users[0]?.amount ?? '0'))

      const reserveUSD = new BigNumber(pair.reserveUSD)
      const totalSupply = new BigNumber(pair.totalSupply)
      const totalTokensStaked = new BigNumber(farmingFromWei(new Wei(pool.totalTokensStaked)))
      const stakeTokenPrice = reserveUSD.dividedBy(totalSupply) as TokenPriceInUSD
      const liquidity = reserveUSD.dividedBy(totalSupply).multipliedBy(totalTokensStaked) as WeiAsToken<BigNumber>

      const annualPercentageRate = new BigNumber(0) as PercentageRate

      const totalLpRewardPricePerYear = new BigNumber(pair.dayData[0].volumeUSD).times(365)
      const lpAnnualPercentageRate = (
        !liquidity.isZero() ? totalLpRewardPricePerYear.div(liquidity).times(100) : new BigNumber(0)
      ) as PercentageRate

      const bonusEndBlock = Number(pool.bonusEndBlock)
      const allocPoint = new BigNumber(pool.allocPoint)
      const totalAllocPoint = new BigNumber(farming.totalAllocPoint)
      const bonusMultiplier = new BigNumber(pool.bonusMultiplier)
      const multiplier = allocPoint
        .dividedBy(totalAllocPoint)
        .multipliedBy(blockNumber < bonusEndBlock ? bonusMultiplier : 1)

      const createdAtBlock = Number(pool.createdAtBlock)

      pools.push({
        id,
        name,
        pairId,
        earned,
        staked,
        annualPercentageRate,
        lpAnnualPercentageRate,
        stakeTokenPrice,
        liquidity,
        multiplier,
        createdAtBlock,
      })
    }

    const sumOfMultipliers = pools.reduce((acc, pool) => acc.plus(pool.multiplier), new BigNumber(0))

    pools = pools.map((pool) => {
      const farmingRewardRate = new BigNumber(farmingFromWei(new Wei(farming.rewardRate)))
      const poolRewardRate = farmingRewardRate.times(pool.multiplier.div(sumOfMultipliers))
      const totalRewardPricePerYear = rewardToken
        ? poolRewardRate.times(BLOCKS_PER_YEAR).times(rewardToken.derivedUSD)
        : null
      // If there is no liquidity, we assume what APR will be if liquidity is equal to 1
      const annualPercentageRate =
        (totalRewardPricePerYear?.div(pool.liquidity.isZero() ? 1 : pool.liquidity).times(100) as PercentageRate) ??
        null
      return {
        ...pool,
        annualPercentageRate,
      }
    })

    return pools
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
      if (searchQuery && !searchQuery.test(x.name)) return false
      return true
    })
  })
}

function comparePools<T extends Pool>(poolA: T, poolB: T, sorting: Sorting): number {
  const zero = new BigNumber(0)
  switch (sorting) {
    case Sorting.Hot:
      return (poolB.annualPercentageRate ?? zero).comparedTo(poolA.annualPercentageRate ?? zero)
    case Sorting.Liquidity:
      return poolB.liquidity.comparedTo(poolA.liquidity)
    case Sorting.AnnualPercentageRate:
      return (poolB.annualPercentageRate ?? zero).comparedTo(poolA.annualPercentageRate ?? zero)
    case Sorting.Multiplier:
      return poolB.multiplier.comparedTo(poolA.multiplier)
    case Sorting.Earned:
      invariant(poolB.earned && poolA.earned)
      return poolB.earned.comparedTo(poolA.earned)
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
