<script lang="ts" setup>
import { buildPair } from '@/utils/pair'
import { storeToRefs } from 'pinia'
import { KlayIconPlus, KlayIconImportant } from '~klay-icons'

const liquidityStore = useLiquidityAddStore()
const { quoteForTask } = storeToRefs(liquidityStore)

const pendingQuoteFor = computed(() => (quoteForTask.value?.pending ? quoteForTask.value.quoteFor : null))
const estimated = computed(() => (quoteForTask.value?.completed ? quoteForTask.value.quoteFor : null))

const models = reactive(
  buildPair((type) => ({
    addr: computed({
      get: () => liquidityStore.selection.input[type].addr,
      set: (addr) => {
        if (addr) {
          liquidityStore.setToken(type, addr)
        }
      },
    }),
    input: computed({
      get: () => liquidityStore.selection.input[type].inputRaw,
      set: (raw) => liquidityStore.input(type, raw),
    }),
  })),
)
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1">
      <InputToken
        v-model="models.tokenA.input"
        v-model:token="models.tokenA.addr"
        :is-loading="pendingQuoteFor === 'tokenA'"
        :estimated="estimated === 'tokenA'"
      />

      <div class="w-full flex justify-center h-0">
        <KlayIconPlus class="-mt-3" />
      </div>

      <InputToken
        v-model="models.tokenB.input"
        v-model:token="models.tokenB.addr"
        :is-loading="pendingQuoteFor === 'tokenB'"
        :estimated="estimated === 'tokenB'"
      />
    </div>

    <div
      v-if="liquidityStore.isEmptyPair"
      class="warning-text"
    >
      <KlayIconImportant />
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
