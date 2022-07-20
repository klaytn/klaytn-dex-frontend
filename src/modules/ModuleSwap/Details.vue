<script setup lang="ts" name="SwapModuleDetails">
import { storeToRefs } from 'pinia'
import invariant from 'tiny-invariant'
import { computeRates, roundRates } from '@/utils/common'
import { buildPair } from '@/utils/pair'
import { roundTo } from 'round-to'

const store = useSwapStore()
const {
  gotAmountFor,
  // FIXME maybe a bug? `selection` does not work for some reason. It should be a ref, but
  // it is undefined. Maybe because it is a reactive object?
  // selection,
} = storeToRefs(store)

const tokens = computed(() => {
  const { tokenA, tokenB } = store.selection.tokens || {}
  if (tokenA && tokenB) return { tokenA, tokenB }
  return null
})

const rates = computed(() => {
  if (gotAmountFor.value) {
    const { tokenA, tokenB } = store.selection.wei || {}
    invariant(tokenA && tokenB)

    const rates = computeRates(buildPair((type) => store.selection.wei[type]!.input))
    return roundRates(rates)
  }

  return null
})

const route = computed(() => {
  const { tokenA, tokenB } = tokens.value || {}
  if (!tokenA || !tokenB) return '-'
  return `${tokenA.symbol} > ${tokenB.symbol}`
})
</script>

<template>
  <div
    v-if="tokens"
    class="details--wrap"
  >
    <KlayCollapse>
      <template #head>
        <h3 class="details--title">
          Transaction Details
        </h3>
      </template>
      <template #main>
        <div class="details">
          <div class="details--row">
            <span>
              {{ tokens.tokenA.symbol }} per
              {{ tokens.tokenB.symbol }}
            </span>
            <span>
              {{ rates?.a_per_b ?? '-' }}
            </span>
          </div>
          <div class="details--row">
            <span>
              {{ tokens.tokenB.symbol }} per
              {{ tokens.tokenA.symbol }}
            </span>
            <span>
              {{ rates?.b_per_a ?? '-' }}
            </span>
          </div>
          <div class="details--row">
            <span>Share of pool</span>
            <i>todo</i>
            <!-- <span>{{ formatPercent(pairBalance, userBalance) }}</span> -->
          </div>
          <div class="details--row">
            <span>Route</span>
            <span>{{ route }}</span>
          </div>
        </div>
      </template>
    </KlayCollapse>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/vars';

.details {
  margin-top: 8px;

  &--title,
  h3 {
    font-style: normal;
    font-weight: 700;
    font-size: 14px;
    line-height: 17px;
    color: $dark2;
    padding: 3px 0;
  }

  &--wrap {
    margin-top: 16px;
  }

  &--row {
    display: flex;
    justify-content: space-between;
    font-style: normal;
    font-weight: 600;
    font-size: 12px;
    line-height: 230%;
    color: $dark2;
  }
}
</style>
