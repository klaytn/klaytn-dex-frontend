import { Ref } from 'vue'
import { Pool, Sorting } from './types'

export function useSortedPools(pools: Ref<Pool[] | null>, sort: Ref<Sorting>) {
  const sorted = computed<Pool[] | null>(() => {
    if (!pools.value) return null
    const sortValue = sort.value

    const list = [...pools.value]

    list.sort((poolA, poolB) => {
      if (sortValue === Sorting.Liquidity) return poolB.liquidity.comparedTo(poolA.liquidity)

      if (sortValue === Sorting.AnnualPercentageRate)
        return poolB.annualPercentageRate.comparedTo(poolA.annualPercentageRate)

      if (sortValue === Sorting.Multiplier) return poolB.multiplier.comparedTo(poolA.multiplier)

      if (sortValue === Sorting.Earned) return poolB.earned.comparedTo(poolA.earned)

      if (sortValue === Sorting.Latest) return poolB.createdAtBlock - poolA.createdAtBlock

      return 0
    })

    return list
  })

  return sorted
}
