import { ValueWei, deadlineFiveMinutesFromNow, tokenWeiToRaw, Address } from '@/core/kaikas'
import { usePairAddress } from '@/modules/ModuleTradeShared/composable.pair-by-tokens'
import { syncInputAddrsWithLocalStorage, useTokensInput } from '@/modules/ModuleTradeShared/composable.tokens-input'
import { buildPair, mirrorTokenType, TokenType } from '@/utils/pair'
import { acceptHMRUpdate, defineStore } from 'pinia'
import invariant from 'tiny-invariant'

export const useLiquidityStore = defineStore('liquidity', () => {
  const kaikasStore = useKaikasStore()

  const selection = useTokensInput()
  syncInputAddrsWithLocalStorage(selection.input, 'liquidity-store-input-tokens')
  const pair = usePairAddress(selection.addrs)

  const quoteFor = ref<null | TokenType>(null)

  async function doQuoteFor(value: ValueWei<string>, quoteFor: TokenType) {
    const kaikas = kaikasStore.getKaikasAnyway()

    invariant(pair.result === 'not-empty', 'Pair should exist')

    const { tokenA, tokenB } = selection.addrs
    invariant(tokenA && tokenB)

    const exchangeRate = await kaikas.tokens.getTokenQuote({
      tokenA,
      tokenB,
      value,
      quoteFor,
    })

    const tokenData = selection.tokens[quoteFor]
    invariant(tokenData)
    selection.input[quoteFor].inputRaw = tokenWeiToRaw(tokenData, exchangeRate)
  }

  async function doAddLiquidity() {
    const kaikas = kaikasStore.getKaikasAnyway()

    await kaikas.liquidity.addLiquidity({
      tokens: buildPair((type) => {
        const addr = selection.addrs[type]
        const wei = selection.wei[type]
        invariant(addr && wei)
        return { addr, desired: wei.input }
      }),
      deadline: deadlineFiveMinutesFromNow(),
    })
  }

  function input(token: TokenType, raw: string) {
    selection.input[token].inputRaw = raw
    quoteFor.value = mirrorTokenType(token)
  }

  function setToken(token: TokenType, addr: Address) {
    selection.input[token].addr = addr
  }

  return {
    selection,
    addLiquidity: doAddLiquidity,
  }
})

if (import.meta.hot) import.meta.hot?.accept(acceptHMRUpdate(useLiquidityStore, import.meta.hot))
