import { Address, TokenSymbol, WeiAsToken } from '@/core'
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'

export interface LiquidityPairsResult {
  user: null | {
    liquidityPositions: Array<LiquidityPairsPosition>
  }
}

export interface LiquidityPairsPosition {
  liquidityTokenBalance: WeiAsToken
  pair: LiquidityPairsPositionItem
}

export interface LiquidityPairsPositionItem {
  id: Address
  name: string
  token0: Token
  token1: Token
  totalSupply: WeiAsToken
  token1Price: WeiAsToken
  reserve0: WeiAsToken
  reserve1: WeiAsToken
  reserveKLAY: WeiAsToken
  reserveUSD: WeiAsToken
  volumeUSD: WeiAsToken
}

interface Token {
  id: Address
  symbol: TokenSymbol
  name: string
  decimals: string
}

export function useLiquidityPairsQuery() {
  const dexStore = useDexStore()

  return useQuery<LiquidityPairsResult>(
    gql`
      query GetUserPairs($id: String!) {
        user(id: $id) {
          liquidityPositions {
            liquidityTokenBalance
            pair {
              id
              name
              reserve0
              reserve1
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
              reserveKLAY
              reserveUSD
              token1Price
              totalSupply
              volumeUSD
            }
          }
        }
      }
    `,
    () => ({
      id: dexStore.account,
    }),
    () => ({
      enabled: !!dexStore.account,
      clientId: 'exchange',
    }),
  )
}
