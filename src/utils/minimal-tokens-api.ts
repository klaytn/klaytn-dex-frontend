import { Address, Token, Wei } from '@/core'
import BigNumber from 'bignumber.js'
import invariant from 'tiny-invariant'
import { InjectionKey } from 'vue'

export interface MinimalTokensApi {
  isSmartContract: (addr: Address) => Promise<boolean>
  getToken: (addr: Address) => Promise<Token>
  /**
   * reactive getter
   */
  lookupBalance: (addr: Address) => null | Wei
  /**
   * reactive getter
   */
  lookupToken: (addr: Address) => null | Token
  /**
   * reactive getter
   */
  lookupDerivedUsd: (addr: Address) => null | BigNumber
}

export const apiKey = Symbol('MinimalTokensApi') as InjectionKey<MinimalTokensApi>

export function useMinimalTokensApi(): MinimalTokensApi {
  const api = inject(apiKey)
  invariant(api, () => `Forgot to provide ${String(apiKey)}?`)
  return api
}
