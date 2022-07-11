import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'

export const MAX_UINT256 = new BigNumber(2).pow(256).minus(1)

export const formattedBigIntDecimals = 6

// Defines the update interval of the pool list in milliseconds
export const refetchPoolsInterval = 10_000

// Defines the update interval of rewards in milliseconds
export const refetchRewardsInterval = 1_000

export const pageSize = 3

export const multicallContractAddress = '0xc88098CEaE07D1FE443372a0accC464A5fb94668'

export const poolsQuery = gql`query PoolsQuery {
  pools {
    id
    stakeToken {
      id
      decimals
      symbol
    }
    rewardToken {
      id
      decimals
      symbol
    }
    createdAtBlock
    totalTokensStaked
    lastRewardBlock
  }
}`

export const liquidityPositionsQuery = gql`query LiquidityPositionsQuery($userId: String!) {
  user(id: $userId) {
    liquidityPositions {
      liquidityTokenBalance
      pair {
        id
      }
    }
  }
}`