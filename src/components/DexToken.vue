<script setup lang="ts">
import { DEX_TOKEN, DEX_TOKEN_FULL, TokenAmount, TokenImpl } from '@/core'

const tokensStore = useTokensStore()

const dexDerivedUsd = computed(() => tokensStore.lookupDerivedUsd(DEX_TOKEN))

const balanceInWei = computed(() => tokensStore.lookupUserBalance(DEX_TOKEN))
const balance = computed(() => balanceInWei.value ? TokenAmount.fromWei(new TokenImpl(DEX_TOKEN_FULL), balanceInWei.value) : null)

useIntervalFn(() => tokensStore.lookupUserBalance(DEX_TOKEN), 10_000)

const balancePrice = computed(() => {
  const derived = dexDerivedUsd.value
  const value = balance.value
  return derived && value && value.quotient.times(derived)
})
</script>

<template>
  <div
    v-if="balance && balancePrice"
    class="token rounded-lg p-3 flex items-center space-x-1 mr-2"
  >
    <div class="balance">
      <CurrencyFormatTruncate
        :amount="balance.quotient"
        :decimals="DEX_TOKEN_FULL.decimals"
        :symbol="DEX_TOKEN_FULL.symbol"
        symbol-position="left"
        :max-width="56"
      />
    </div>
    <div class="price">
      (<CurrencyFormatTruncate
        :amount="balancePrice"
        usd
        :max-width="56"
      />)
    </div>
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
