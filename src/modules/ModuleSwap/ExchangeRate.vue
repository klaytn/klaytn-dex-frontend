<script setup lang="ts" name="SwapModuleExchangeRate">
import { storeToRefs } from 'pinia'
import { buildPair, TOKEN_TYPES } from '@/utils/pair'
import { KlayIconArrowDown } from '~klay-icons'

const swapStore = useSwapStore()
const { gettingAmountFor, inputRates } = $(storeToRefs(swapStore))

const models = reactive(
  buildPair((type) => {
    return {
      input: computed({
        get: () => inputRates[type]?.value,
        set: (v) => v && swapStore.setTokenValue(type, v),
      }),
      addr: computed({
        get: () => swapStore.addrs[type],
        set: (addr) => {
          swapStore.setToken(type, addr)
        },
      }),
    }
  }),
)
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1">
      <template
        v-for="(type, i) in TOKEN_TYPES"
        :key="type"
      >
        <InputToken
          v-model="models[type].input"
          v-model:token="models[type].addr"
          set-by-balance
          :is-loading="gettingAmountFor === type"
          :estimated="inputRates[type]?.type === 'estimated'"
        />

        <div
          v-if="i === 0"
          class="w-full flex justify-center items-center h-0"
        >
          <KlayIconArrowDown />
        </div>
      </template>
    </div>
  </div>
</template>
