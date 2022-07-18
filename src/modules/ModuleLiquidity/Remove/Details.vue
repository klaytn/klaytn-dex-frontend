<script setup lang="ts">
import { buildPair } from '@/utils/pair'
import { storeToRefs } from 'pinia'
// import { formatWeiValue } from '@/utils/common'
import { asWei } from '@/core/kaikas'

const store = useLiquidityRmStore()
const { selected, amounts, selectedTokensData } = storeToRefs(store)

const symbols = reactive(buildPair((type) => computed(() => selectedTokensData.value[type]?.symbol)))

const amountsStr = computed(() => {
  if (!amounts.value) return null
  return buildPair((type) => asWei(amounts.value![type].toString()))
})
</script>

<template>
  <!-- FIXME broken style -->
  <KlayCollapse v-if="selected && symbols.tokenA && symbols.tokenB && amountsStr">
    <template #head>
      <h3 class="rl--collapse-label">
        LP tokens details
      </h3>
    </template>
    <template #main>
      <div class="space-y-4">
        <div class="row">
          <div>{{ symbols.tokenA }}</div>
          <div>
            <!-- {{ formatWeiValue(amountsStr.tokenA) }} -->
          </div>
        </div>
        <div class="row">
          <div>{{ symbols.tokenB }}</div>
          <div>
            <!-- {{ formatWeiValue(amountsStr.tokenB) }} -->
          </div>
        </div>
        <div class="row">
          <div>
            {{ symbols.tokenA }} per
            {{ symbols.tokenB }}
          </div>
          <div>-</div>
        </div>
        <div class="row">
          <div>
            {{ symbols.tokenB }} per
            {{ symbols.tokenA }}
          </div>
          <div>-</div>
        </div>
      </div>
    </template>
  </KlayCollapse>
</template>

<style lang="scss">
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
