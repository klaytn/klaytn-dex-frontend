<script lang="ts" setup>
import { WeiAsToken } from '@/core'
import { nonNullSet } from '@/utils/common'
import { TOKEN_TYPES, buildPair } from '@/utils/pair'
import BigNumber from 'bignumber.js'
import { storeToRefs } from 'pinia'
import { KlayIconImportant, KlayIconPlus } from '~klay-icons'
import InputToken from '@/components/InputToken.vue'

const liquidityStore = useLiquidityAddStore()
const { isQuotePendingFor, tokenValues, addrs, estimatedFor, isValuesDebounceWelcome } = storeToRefs(liquidityStore)

const models = reactive(
  buildPair((type) => {
    return {
      input: computed<WeiAsToken<BigNumber>>({
        get: () => {
          const val = tokenValues.value[type]
          return new BigNumber(val ?? '0') as WeiAsToken<BigNumber>
        },
        set: (v) => v && liquidityStore.setToken(type, v.toFixed() as WeiAsToken),
      }),
      addr: computed({
        get: () => addrs.value[type],
        set: (addr) => liquidityStore.setTokenAddress(type, addr),
      }),
    }
  }),
)

const allSelectedTokens = computed(() => nonNullSet(Object.values(addrs.value)))
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
          :is-loading="isQuotePendingFor === type"
          :estimated="estimatedFor === type"
          :selected="allSelectedTokens"
          :value-debounce="isValuesDebounceWelcome ? 500 : 0"
          set-by-balance
          show-warning
        />
        <div
          v-if="i === 0"
          class="w-full flex justify-center items-center h-0"
        >
          <KlayIconPlus class="shadow-md rounded-full" />
        </div>
      </template>
    </div>

    <div
      v-if="liquidityStore.isEmptyPair"
      class="empty-pair-alert p-4 space-x-2 rounded-lg flex items-start"
    >
      <div>
        <KlayIconImportant class="warning-icon" />
      </div>
      <p class="warning-text">
        Pair doesn't exist. You will create one. Its rates will be equal to the rates you set.
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.empty-pair-alert {
  border: 1px solid vars.$gray5;
}

.warning-icon {
  color: vars.$orange;
  font-size: 15px;
}

.warning-text {
  font-weight: 600;
  font-size: 12px;
  line-height: 140%;
}
</style>
