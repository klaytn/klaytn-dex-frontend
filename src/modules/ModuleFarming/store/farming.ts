import { Address, asWei, Kaikas } from '@/core/kaikas'
import { useLazyQuery, useQuery } from '@vue/apollo-composable'
import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'
import { acceptHMRUpdate, defineStore } from 'pinia'
import {
  FARMING_CONTRACT_ADDRESS,
  MULTICALL_CONTRACT_ADDRESS,
  REFETCH_FARMING_INTERVAL,
  REFETCH_REWARDS_INTERVAL,
} from '../const'
import { Pool, Rewards, Sorting } from '../types'
import { Multicall } from '@/types/typechain/farming/MultiCall.sol'
import { MULTICALL, FARMING } from '@/core/kaikas/smartcontracts/abi'
import invariant from 'tiny-invariant'
import { Task, useDanglingScope, useScope, useTask, wheneverTaskSucceeds } from '@vue-kakuyaku/core'
import { Ref } from 'vue'
import { deepClone } from '@/utils/common'
import { not, or } from '@vueuse/core'
import { farmingFromWei, farmingToWei } from '../utils'
import { Status } from '@soramitsu-ui/ui'

interface FarmingQueryResult {
  farming: {
    id: Address
    poolCount: number
    totalAllocPoint: string
    pools: {
      id: Address
      pair: Address
      bonusMultiplier: string
      /**
       * FIXME is it wei?
       */
      totalTokensStaked: string
      allocPoint: string
      bonusEndBlock: string
      createdAtBlock: string
      users: {
        amount: string
      }[]
    }[]
  }
}

interface PairsQueryResult {
  pairs: {
    id: Address
    name: string
    reserveUSD: string
    totalSupply: string
  }[]
}

interface LiquidityPositionsQueryResult {
  user: {
    liquidityPositions: {
      liquidityTokenBalance: string
      pair: {
        id: Address
      }
    }[]
  }
}

function useBlockNumber(kaikas: Kaikas): Ref<number | null> {
  const blockNumber = ref<number | null>(null)

  const task = useTask(async () => {
    const value = await kaikas.cfg.caver.klay.getBlockNumber()
    blockNumber.value = value
  })
  task.run()

  useScope(
    computed(() => blockNumber.value !== null),
    () => {
      useIntervalFn(() => {
        invariant(typeof blockNumber.value === 'number')
        blockNumber.value++
      }, 1000)
    },
  )

  return blockNumber
}

function useSortedPools(pools: Ref<Pool[] | null>, sort: Ref<Sorting>) {
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

function useFetchRewards({
  kaikas,
  farmingPoolIds,
  updateBlockNumber,
}: {
  kaikas: Kaikas
  farmingPoolIds: Ref<Address[] | null>
  updateBlockNumber: (value: number) => void
}): {
  /**
   * reactive object
   */
  rewards: Rewards
  areRewardsFetched: Ref<boolean>
} {
  const MulticallContract = kaikas.cfg.createContract<Multicall>(MULTICALL_CONTRACT_ADDRESS, MULTICALL)

  const rewards = reactive<Rewards>({})

  const fetchedRewards = computed<Set<Address>>(() => {
    return new Set(Object.keys(rewards) as Address[])
  })
  const rewardsToFetch = computed<Set<Address>>(() => {
    return new Set((farmingPoolIds.value ?? []).filter((addr) => !fetchedRewards.value.has(addr)))
  })
  const areRewardsFetched = computed<boolean>(() => !rewardsToFetch.value.size)

  const fetchRewardsTaskScope = useDanglingScope<Task<{ blockNumber: number; rewards: Rewards }>>()

  function fetchRewards() {
    const ids = [...rewardsToFetch.value]
    if (!ids.length) return

    fetchRewardsTaskScope.setup(() => {
      const task = useTask(async () => {
        /**
         * FIXME describe magic constant
         */
        const PENDING_PTN_ABI_NAME = 'pendingPtn' as const
        const abiItem = FARMING.find((item) => item.name === PENDING_PTN_ABI_NAME)
        invariant(abiItem)

        const calls = ids.map((poolId) => {
          return [
            FARMING_CONTRACT_ADDRESS,
            kaikas.cfg.caver.klay.abi.encodeFunctionCall(abiItem, [poolId, kaikas.selfAddress]),
          ] as [string, string]
        })

        const result = await MulticallContract.methods.aggregate(calls).call()

        const rewards = result.returnData.reduce<Rewards>((acc, hexString, index) => {
          const poolId = ids[index]
          acc[poolId] = farmingFromWei(asWei(kaikas.cfg.caver.klay.abi.decodeParameter('uint256', hexString)))
          return acc
        }, {})

        return {
          rewards,
          blockNumber: Number(result.blockNumber),
        }
      })

      task.run()

      wheneverTaskSucceeds(task, (result) => {
        updateBlockNumber(result.blockNumber)
        Object.assign(rewards, result.rewards)
      })

      return task
    })
  }

  const fetchRewardsThrottled = useThrottleFn(fetchRewards, REFETCH_REWARDS_INTERVAL)
  useIntervalFn(() => fetchRewardsThrottled(), REFETCH_REWARDS_INTERVAL)
  whenever(
    () => rewardsToFetch.value.size > 0,
    () => fetchRewardsThrottled(),
  )

  return { rewards, areRewardsFetched }
}

function setupQueries({
  kaikas,
  stakedOnly,
  searchQuery,
  sorting,
}: {
  // FIXME kaikas maybe not always available
  kaikas: Kaikas
  stakedOnly: Ref<boolean>
  searchQuery: Ref<string>
  sorting: Ref<Sorting>
}) {
  const blockNumber = useBlockNumber(kaikas)
  function updateBlockNumber(value: number) {
    blockNumber.value = value
  }

  const FarmingQuery = useQuery<FarmingQueryResult>(
    gql`
    query FarmingQuery($userId: String!) {
      farming(id: "${FARMING_CONTRACT_ADDRESS}") {
        id
        poolCount
        totalAllocPoint
        pools {
          id
          pair
          bonusMultiplier
          totalTokensStaked
          allocPoint
          bonusEndBlock
          createdAtBlock
          users(where: {address: $userId}) {
            amount
          }
        }
      }
    }
  `,
    () => ({
      userId: kaikas.selfAddress,
    }),
    {
      clientId: 'farming',
      pollInterval: REFETCH_FARMING_INTERVAL,
    },
  )

  const farming = computed(() => FarmingQuery.result.value?.farming ?? null)

  const farmingPoolIds = computed(() => {
    if (farming.value === null) return null

    return farming.value.pools.map((pool) => pool.id)
  })

  const poolPairIds = computed(() => {
    return farming.value?.pools.map((pool) => pool.pair) ?? []
  })

  const pairsQueryVariables = ref<{ pairIds: Address[] }>({
    pairIds: [],
  })
  const PairsQuery = useLazyQuery<PairsQueryResult>(
    gql`
      query PairsQuery($pairIds: [String]!) {
        pairs(where: { id_in: $pairIds }) {
          id
          name
          reserveUSD
          totalSupply
        }
      }
    `,
    pairsQueryVariables,
    {
      clientId: 'exchange',
      pollInterval: REFETCH_FARMING_INTERVAL,
    },
  )

  const pairs = computed(() => {
    return PairsQuery.result.value?.pairs ?? null
  })

  function handleFarmingQueryResult() {
    pairsQueryVariables.value.pairIds = poolPairIds.value

    PairsQuery.load()

    if (PairsQuery.result) PairsQuery.refetch()
  }

  // Workaround for cached results: https://github.com/vuejs/apollo/issues/1154
  if (FarmingQuery.result.value) handleFarmingQueryResult()

  FarmingQuery.onResult(() => {
    handleFarmingQueryResult()
  })

  const { rewards, areRewardsFetched } = useFetchRewards({ kaikas, farmingPoolIds, updateBlockNumber })

  const LiquidityPositionsQuery = useQuery<LiquidityPositionsQueryResult>(
    gql`
      query LiquidityPositionsQuery($userId: String!) {
        user(id: $userId) {
          liquidityPositions {
            liquidityTokenBalance
            pair {
              id
            }
          }
        }
      }
    `,
    () => ({
      userId: kaikas.selfAddress,
    }),
    { clientId: 'exchange' },
  )

  const liquidityPositions = computed(() => {
    if (!LiquidityPositionsQuery.result.value) return null
    return LiquidityPositionsQuery.result.value.user?.liquidityPositions ?? []
  })

  const pools = computed<Pool[] | null>(() => {
    if (farming.value === null || pairs.value === null || blockNumber.value === null) return null

    const pools = [] as Pool[]

    farming.value.pools.forEach((pool) => {
      if (farming.value === null || pairs.value === null || blockNumber.value === null) return

      const id = pool.id
      const pair = pairs.value.find((pair) => pair.id === pool.pair) ?? null

      const reward = rewards[pool.id]
      const earned = reward ? new BigNumber(reward) : null

      if (pair === null || earned === null) return

      const pairId = pair.id
      const name = pair.name

      const staked = new BigNumber(farmingFromWei(asWei(pool.users[0]?.amount ?? '0')))

      const liquidityPosition = liquidityPositions.value?.find((position) => position.pair.id === pairId) ?? null
      const balance = new BigNumber(liquidityPosition?.liquidityTokenBalance ?? 0)

      const annualPercentageRate = new BigNumber(0)

      const reserveUSD = new BigNumber(pair.reserveUSD)
      const totalSupply = new BigNumber(pair.totalSupply)
      const totalTokensStaked = new BigNumber(farmingFromWei(asWei(pool.totalTokensStaked)))
      const liquidity = reserveUSD.dividedBy(totalSupply).multipliedBy(totalTokensStaked)

      const bonusEndBlock = Number(pool.bonusEndBlock)
      const allocPoint = new BigNumber(pool.allocPoint)
      const totalAllocPoint = new BigNumber(farming.value.totalAllocPoint)
      const bonusMultiplier = new BigNumber(pool.bonusMultiplier)
      const multiplier = allocPoint
        .dividedBy(totalAllocPoint)
        .multipliedBy(blockNumber.value < bonusEndBlock ? bonusMultiplier : 1)

      const createdAtBlock = Number(pool.createdAtBlock)

      pools.push({
        id,
        name,
        pairId,
        earned,
        staked,
        balance,
        annualPercentageRate,
        liquidity,
        multiplier,
        createdAtBlock,
      })
    })

    return pools
  })

  const filteredPools = computed<Pool[] | null>(() => {
    if (pools.value === null) return null

    let filteredPools = [...pools.value]

    if (stakedOnly.value) filteredPools = filteredPools.filter((pool) => !pool.staked.isZero())

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filteredPools = filteredPools.filter((pool) => pool.name.toLowerCase().includes(query))
    }

    return filteredPools
  })

  const sortedPools = useSortedPools(filteredPools, sorting)

  const isLoading = or(
    FarmingQuery.loading,
    LiquidityPositionsQuery.loading,
    PairsQuery.loading,
    not(areRewardsFetched),
  )

  for (const [QueryName, Query] of Object.entries({ FarmingQuery, LiquidityPositionsQuery, PairsQuery })) {
    Query.onError((param) => {
      console.error('query error', param)
      $notify({ status: Status.Error, description: `Apollo error (${QueryName}): ${String(param)}` })
    })
  }

  /**
   * FIXME use "optimistic response" API for query result replacement
   */
  function updateStaked(poolId: Pool['id'], diff: BigNumber) {
    if (!FarmingQuery.result.value) return

    const diffAsWei = asWei(new BigNumber(farmingToWei(diff.toString())))
    const farmingQueryResultCloned = deepClone(FarmingQuery.result.value)
    const pool = farmingQueryResultCloned.farming.pools.find((pool) => pool.id === poolId)
    if (!pool) return

    pool.totalTokensStaked = new BigNumber(pool.totalTokensStaked).plus(diffAsWei).toFixed(0)

    const user = pool.users[0] ?? null
    if (!user) return

    user.amount = new BigNumber(user.amount).plus(diffAsWei).toFixed(0)
    FarmingQuery.result.value = farmingQueryResultCloned
  }

  /**
   * FIXME use "optimistic response" API for query result replacement
   */
  function updateBalance(pairId: Pool['pairId'], diff: BigNumber) {
    if (!LiquidityPositionsQuery.result.value) return

    const liquidityPositionsQueryResultCloned = deepClone(LiquidityPositionsQuery.result.value)
    const liquidityPosition =
      liquidityPositionsQueryResultCloned.user.liquidityPositions.find(
        (liquidityPosition) => liquidityPosition.pair.id === pairId,
      ) ?? null
    if (!liquidityPosition) return

    liquidityPosition.liquidityTokenBalance = `${new BigNumber(liquidityPosition.liquidityTokenBalance).plus(diff)}`
    LiquidityPositionsQuery.result.value = liquidityPositionsQueryResultCloned
  }

  function handleStaked(pool: Pool, amount: string) {
    updateStaked(pool.id, new BigNumber(amount))
    updateBalance(pool.pairId, new BigNumber(0).minus(amount))
  }
  function handleUnstaked(pool: Pool, amount: string) {
    updateStaked(pool.id, new BigNumber(0).minus(amount))
    updateBalance(pool.pairId, new BigNumber(amount))
  }

  return reactive({
    sortedPools,
    filteredPools,
    pools,

    liquidityPositions,
    rewards,
    pairs,
    farming,
    farmingPoolIds,

    blockNumber,

    handleStaked,
    handleUnstaked,

    isLoading,
  })
}

export const useFarmingStore = defineStore('farming', () => {
  const kaikasStore = useKaikasStore()

  const stakedOnly = ref(false)
  const searchQuery = ref('')
  const sorting = ref<Sorting>(Sorting.Default)

  const queryScope = useDanglingScope<ReturnType<typeof setupQueries>>()

  function setupQueriesScope() {
    const kaikas = kaikasStore.getKaikasAnyway()
    queryScope.setup(() => setupQueries({ kaikas, searchQuery, stakedOnly, sorting }))
  }

  function useQueryScopeAnyway() {
    const setup = queryScope.scope.value?.setup
    invariant(setup)
    return setup
  }

  return { setupQueries: setupQueriesScope, useQueryScopeAnyway, stakedOnly, searchQuery, sorting }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useSwapStore, import.meta.hot))
