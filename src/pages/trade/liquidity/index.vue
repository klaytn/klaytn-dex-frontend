<script lang="ts" setup>
import { RouteName } from '@/types'
</script>

<template>
  <div class="space-y-4">
    <h3 class="title px-4">
      Add liquidity to receive LP tokens
    </h3>

    <RouterLink
      :to="{ name: RouteName.LiquidityAdd }"
      class="block mx-4"
    >
      <KlayButton
        type="primary"
        size="lg"
        class="w-full"
      >
        Add Liquidity
      </KlayButton>
    </RouterLink>

    <hr>

    <ModuleLiquidityView />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/vars';

.title {
  text-align: left;
  font-style: normal;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: vars.$dark2;
}

hr {
  background: vars.$gray5;
  height: 1px;
}
</style>
