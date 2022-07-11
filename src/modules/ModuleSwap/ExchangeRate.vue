<script setup lang="ts" name="SwapModuleExchangeRate">
import { storeToRefs } from 'pinia'
import { buildPair } from '@/utils/pair'

const swapStore = useSwapStore()
const { gettingAmountFor } = $(storeToRefs(swapStore))

const models = reactive(
  buildPair((type) => ({
    input: computed({
      get: () => swapStore.selection[type].inputRaw,
      set: (raw) => {
        swapStore.setTokenValue(type, raw)
      },
    }),
    addr: computed({
      get: () => swapStore.selection[type].addr,
      set: (addr) => {
        swapStore.setToken(type, addr)
      },
    }),
  })),
)
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1">
      <TokenInput
        v-model="models.tokenA.input"
        v-model:token="models.tokenA.addr"
        :is-loading="gettingAmountFor === 'tokenA'"
        set-by-balance
      />
      <div class="w-full flex justify-center items-center h-0">
        <IconKlayArrowDown />
      </div>
      <TokenInput
        v-model="models.tokenB.input"
        v-model:token="models.tokenB.addr"
        :is-loading="gettingAmountFor === 'tokenB'"
        :is-disabled="!models.tokenA.addr"
      />
    </div>
  </div>
</template>
