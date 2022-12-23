<script setup lang="ts">
import { DEX_TOKEN, DEX_TOKEN_FULL } from '@/core'

const tokensStore = useTokensStore()

const dexDerivedUsd = computed(() => tokensStore.lookupDerivedUsd(DEX_TOKEN))

const balance = computed(() => tokensStore.lookupUserBalance(DEX_TOKEN)?.decimals(DEX_TOKEN_FULL) ?? null)

const balancePrice = computed(() => {
  const usd = dexDerivedUsd.value
  const token = balance.value
  return usd && token && token.times(usd)
})
</script>

<template>
  <div
    v-if="balance"
    class="token lt-md:flex-col flex justify-center items-center h-full rounded-lg md:py-3 px-3 gap-1 space-x-1 mr-2"
  >
    <div class="balance">
      <CurrencyFormatTruncate
        :amount="balance"
        :decimals="DEX_TOKEN_FULL.decimals"
        :symbol="DEX_TOKEN_FULL.symbol"
        symbol-position="left"
        :max-width="56"
      />
    </div>
    <div
      v-if="balancePrice"
      class="price flex"
    >
      (<CurrencyFormatTruncate
        :amount="balancePrice"
        usd
        :max-width="56"
      />)
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.token {
  background: white;
  font-size: 12px;
}

.balance {
  font-weight: 700;
}

.price {
  color: vars.$gray2;
}
</style>
