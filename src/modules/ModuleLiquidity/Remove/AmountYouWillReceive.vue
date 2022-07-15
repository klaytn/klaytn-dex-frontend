<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { buildPair } from '@/utils/pair'

const store = useLiquidityRmStore()
const { amounts, selectedTokensData: tokens } = storeToRefs(store)
const symbols = reactive(buildPair((type) => computed(() => tokens.value[type]?.symbol)))
</script>

<template>
  <div v-if="symbols.tokenA && symbols.tokenB">
    <h4>
      <span> You will receive </span>
      <IconKlayImportant />
    </h4>

    <div class="row">
      <div>{{ symbols.tokenA }}</div>
      <div>{{ amounts?.tokenA }}</div>
    </div>

    <div class="row">
      <div>{{ symbols.tokenB }}</div>
      <div>{{ amounts?.tokenB }}</div>
    </div>

    <template>
      <div class="row">
        <div>
          {{ symbols.tokenA }}
          per
          {{ symbols.tokenB }}
        </div>
        <i>todo</i>
      </div>

      <div class="row">
        <div>
          {{ symbols.tokenB }}
          per
          {{ symbols.tokenA }}
        </div>
        <i>todo</i>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;

  & div {
    width: 50%;
    font-style: normal;
    font-weight: 600;
    font-size: 12px;
  }

  & div:last-child {
    text-align: right;
  }
}
</style>
