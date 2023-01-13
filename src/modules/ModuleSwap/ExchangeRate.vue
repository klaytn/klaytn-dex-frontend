<script setup lang="ts" name="SwapModuleExchangeRate">
import { storeToRefs } from 'pinia'
import { TOKEN_TYPES, buildPair } from '@/utils/pair'
import { KlayIconArrowDown } from '~klay-icons'
import { nonNullSet } from '@/utils/common'
import BigNumber from 'bignumber.js'
import { WeiAsToken } from '@/core'
import InputToken from '@/components/InputToken.vue'

const swapStore = useSwapStore()
const { gettingAmountFor, tokenValues, estimatedFor } = $(storeToRefs(swapStore))

const models = reactive(
  buildPair((type) => {
    return {
      input: computed<WeiAsToken<BigNumber>>({
        get: () => {
          const val = tokenValues[type]
          return new BigNumber(val ?? '0') as WeiAsToken<BigNumber>
        },
        set: (v) => swapStore.setToken(type, v.toFixed() as WeiAsToken),
      }),
      addr: computed({
        get: () => swapStore.addrs[type],
        set: (addr) => {
          swapStore.setTokenAddress(type, addr)
        },
      }),
    }
  }),
)

const allSelectedTokens = computed(() => nonNullSet(Object.values(swapStore.addrs)))
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
          v-model:address="models[type].addr"
          set-by-balance
          :is-loading="gettingAmountFor === type"
          :estimated="estimatedFor === type"
          :selected="allSelectedTokens"
          :data-testid="`swap-input-${type}`"
          :show-warning="type === 'tokenA'"
        />

        <div
          v-if="i === 0"
          class="w-full flex justify-center items-center h-0"
        >
          <button
            class="shadow-md rounded-full overflow-hidden"
            @click="swapStore.swapTokensWithEachOther()"
          >
            <KlayIconArrowDown />
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
