import { Address, TokenSymbol } from '@/core/kaikas'
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { Opaque } from 'type-fest'

export interface LiquidityPairsResult {
  user: null | {
    liquidityPositions: Array<LiquidityPairsPosition>
  }
}

export interface LiquidityPairsPosition {
  liquidityTokenBalance: LiquidityPairValueRaw
  pair: LiquidityPairsPositionItem
}

export interface LiquidityPairsPositionItem {
  id: Address
  name: string
  token0: Token
  token1: Token
  totalSupply: LiquidityPairValueRaw
  token1Price: LiquidityPairValueRaw
  reserve0: LiquidityPairValueRaw
  reserve1: LiquidityPairValueRaw
  reserveKLAY: LiquidityPairValueRaw
  reserveUSD: LiquidityPairValueRaw
  volumeUSD: LiquidityPairValueRaw
}

interface Token {
  id: Address
  symbol: TokenSymbol
  name: string
  decimals: string
}

export type LiquidityPairValueRaw = Opaque<string, 'ValueRaw'>

export function useLiquidityPairsQuery() {
  const kaikasStore = useKaikasStore()

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
      id: kaikasStore.address,
    }),
    () => ({
      enabled: !!kaikasStore.address,
      clientId: 'exchange',
    }),
  )
}
