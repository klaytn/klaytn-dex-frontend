import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'

export const MAX_UINT256 = new BigNumber(2).pow(256).minus(1)

export const formattedBigIntDecimals = 6

export const farmingContractAddress = '0x32be07fb9dbf294c2e92715f562f7aba02b7443a'

export const farmingsQuery = gql`query FarmingsQuery($first: Int! $skip: Int! $userId: String!) {
  farmings {
    id
    poolCount
    pools(first: $first skip: $skip) {
      id
      pair
      users(where: {address: $userId}) {
        pool {
          id
        }
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
    dayData(first: 7, orderBy: timestamp, orderDirection: desc) {
      volumeUSD
    }
    reserveUSD
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