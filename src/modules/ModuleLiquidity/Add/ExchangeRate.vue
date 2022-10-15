<script lang="ts" setup>
import { WeiAsToken } from '@/core'
import { nonNullSet } from '@/utils/common'
import { buildPair, TOKEN_TYPES } from '@/utils/pair'
import BigNumber from 'bignumber.js'
import { storeToRefs } from 'pinia'
import { KlayIconPlus, KlayIconImportant } from '~klay-icons'
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
        set: (addr) => addr && liquidityStore.setTokenAddress(type, addr),
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
      class="warning-text"
    >
      <KlayIconImportant />
      <span>Pair doesn't exist</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.warning-text {
  margin-top: 16px;
  font-style: normal;
  font-weight: 700;
  font-size: 14px;
  line-height: 180%;
  color: #2d2926;
  margin-right: 5px;
  display: flex;
  align-items: center;
  justify-content: center;

  & .svg-icon {
    height: 20px;
  }

  & span {
    margin-left: 5px;
  }
}
</style>
