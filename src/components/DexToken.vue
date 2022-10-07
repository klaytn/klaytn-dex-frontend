<script setup lang="ts">
import { DEX_TOKEN, DEX_TOKEN_DECIMALS, DEX_TOKEN_REFETCH_INTERVAL, CurrencySymbol, CURRENCY_USD } from '@/core'
import { TokenAmount, Price, TokenImpl } from '@/core/entities'
import { useTokensQuery } from '@/query/tokens-derived-usd'
import BigNumber from 'bignumber.js'

const dexStore = useDexStore()

const dexToken = new TokenImpl({
  address: DEX_TOKEN,
  decimals: DEX_TOKEN_DECIMALS,
  symbol: 'DEX' as CurrencySymbol,
  name: 'DEX Token',
})

const TokensQuery = useTokensQuery([dexToken.address], { pollInterval: DEX_TOKEN_REFETCH_INTERVAL })
TokensQuery.load()

const balance = ref<TokenAmount | null>(null)
const balancePrice = computed(() => {
  const derivedUSD = TokensQuery.result.value?.tokens[0].derivedUSD
  if (!derivedUSD || !balance.value) return null

  return balance.value.toFraction().quotient.multipliedBy(new BigNumber(derivedUSD))
  // return new Price({
  //   baseCurrency: CURRENCY_USD,
  //   quoteCurrency: dexToken,
  //   denominator: ,
  //   numerator:
  // })
})

async function fetchBalance() {
  if (!dexStore.isWalletConnected) return
  const dex = dexStore.getNamedDexAnyway()
  const [result] = await dex.tokens.getBalancesBunch([{ address: dexToken.address, balanceOf: dex.agent.address }])
  balance.value = TokenAmount.fromWei(dexToken, result)
}

whenever(
  computed(() => dexStore.isWalletConnected),
  () => fetchBalance(),
  { immediate: true },
)

useIntervalFn(fetchBalance, DEX_TOKEN_REFETCH_INTERVAL)

const balanceFormatted = computed(() => {
  if (!balance.value) return null
  return balance.value.toFormat(4).replace(/\.?0+$/, '')
})

const balancePriceFormatted = computed(() => {
  if (!balancePrice.value) return null
  return '$ ' + balancePrice.value.toFormat(CURRENCY_USD.decimals).replace(/\.?0+$/, '')
})
</script>

<template>
  <div
    v-if="balanceFormatted && balancePriceFormatted"
    class="token rounded-lg p-3 flex items-center space-x-2 mr-2"
  >
    <span class="balance"> DEX {{ balanceFormatted }} </span>
    <span class="price"> ({{ balancePriceFormatted }}) </span>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

.token {
  background: white;
  font-size: 12px;
}

.balance {
  font-weight: 700;
}

.price {
  color: $gray2;
}
</style>
