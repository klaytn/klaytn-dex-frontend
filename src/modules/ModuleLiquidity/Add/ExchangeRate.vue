<script lang="ts" setup>
import { buildPair } from '@/utils/pair'
import { storeToRefs } from 'pinia'

const liquidityStore = useLiquidityAddStore()
const { isQuotePendingFor, quoteExchangeRate } = storeToRefs(liquidityStore)

const estimated = computed(() => quoteExchangeRate.value?.quoteFor ?? null)

const models = reactive(
  buildPair((type) => {
    const inputInStore = computed(() => liquidityStore.selection.input[type].inputRaw)
    const input = ref<string>()
    watch(
      inputInStore,
      (val) => {
        input.value = val
      },
      { immediate: true },
    )
    watchDebounced(input, (value) => value && value !== inputInStore.value && liquidityStore.input(type, value), {
      debounce: 500,
    })

    return {
      addr: computed({
        get: () => liquidityStore.selection.input[type].addr,
        set: (addr) => {
          if (addr) {
            liquidityStore.setToken(type, addr)
          }
        },
      }),
      input,
    }
  }),
)
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1">
      <InputToken
        v-model="models.tokenA.input"
        v-model:token="models.tokenA.addr"
        :is-loading="isQuotePendingFor === 'tokenA'"
        :estimated="estimated === 'tokenA'"
      />

      <div class="w-full flex justify-center h-0">
        <IconKlayPlus class="-mt-3" />
      </div>

      <InputToken
        v-model="models.tokenB.input"
        v-model:token="models.tokenB.addr"
        :is-loading="isQuotePendingFor === 'tokenB'"
        :estimated="estimated === 'tokenB'"
      />
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
