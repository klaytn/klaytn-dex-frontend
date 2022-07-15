<script lang="ts" setup>
const modal = ref(false)
</script>

<template>
  <div class="space-y-4 px-4">
    <ModuleLiquidityAddExchangeRate />

    <KlayButton
      class="w-full"
      size="lg"
      type="primary"
      @click="modal = true"
    >
      Supply
    </KlayButton>

    <ModuleLiquidityAddConfirmModal v-model="modal" />

    <!-- TODO -->
    <!-- <Details v-if="false && selectedTokens.tokenA?.value && selectedTokens.tokenB?.value">
      <template #title>
        Prices and pool share
      </template>

      <DetailsRow>
        <span>
          {{ selectedTokens.tokenA.symbol }} per
          {{ selectedTokens.tokenB.symbol }}
        </span>
        <span>
          {{ formatRate(selectedTokens.tokenA.value, selectedTokens.tokenB.value) }}
        </span>
      </DetailsRow>
      <DetailsRow>
        <span>
          {{ selectedTokens.tokenB.symbol }} per
          {{ selectedTokens.tokenA.symbol }}
        </span>
        <span>
          {{ formatRate(selectedTokens.tokenB.value, selectedTokens.tokenA.value) }}
        </span>
      </DetailsRow>
      <DetailsRow v-if="selectedTokens.pairBalance && selectedTokens.userBalance">
        <span>Share of pool</span>
        <span>{{ formatPercent(selectedTokens.pairBalance, selectedTokens.userBalance) }}</span>
      </DetailsRow>
    </Details> -->
  </div>
</template>
