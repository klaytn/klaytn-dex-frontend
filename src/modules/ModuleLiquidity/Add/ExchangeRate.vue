<script lang="ts" setup>
import { buildPair, TOKEN_TYPES } from '@/utils/pair'
import { storeToRefs } from 'pinia'

const liquidityStore = useLiquidityAddStore()
const { isQuotePendingFor, inputRates, addrs } = storeToRefs(liquidityStore)

const models = reactive(
  buildPair((type) => {
    return {
      input: computed({
        get: () => inputRates.value[type]?.value,
        set: (v) => v && liquidityStore.input(type, v),
      }),
      addr: computed({
        get: () => addrs.value[type],
        set: (addr) => addr && liquidityStore.setToken(type, addr),
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
          :is-loading="isQuotePendingFor === type"
          :estimated="inputRates[type]?.type === 'estimated'"
        />
        <div
          v-if="i === 0"
          class="w-full flex justify-center h-0"
        >
          <IconKlayPlus class="-mt-3" />
        </div>
      </template>
    </div>

    <div
      v-if="liquidityStore.isEmptyPair"
      class="warning-text"
    >
      <IconKlayImportant />
      <span>Pair not exist</span>
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
