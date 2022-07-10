import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'

export const MAX_UINT256 = new BigNumber(2).pow(256).minus(1)

export const formattedBigIntDecimals = 6

// Defines the update interval of the pool list in milliseconds
export const refetchFarmingInterval = 10_000

// Defines the update interval of rewards in milliseconds
export const refetchRewardsInterval = 1_000

export const pageSize = 8

export const farmingContractAddress = '0x32bE07FB9dBf294c2e92715F562f7aBA02b7443A'
export const multicallContractAddress = '0xc88098CEaE07D1FE443372a0accC464A5fb94668'

export const farmingQuery = gql`query FarmingQuery($userId: String!) {
  farming(id: "${farmingContractAddress}") {
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
}`

export const pairsQuery = gql`query PairsQuery($pairIds: [String]!) {
  pairs(
    where: { id_in: $pairIds }
  ) {
    id
    name
    reserveUSD
    totalSupply
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