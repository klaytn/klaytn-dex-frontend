<template>
  <div class="root">
    <ModuleLiquidityRemoveAmountPicker class="p-4" />
    <div class="divider" />
    <ModuleLiquidityRemoveAmountYouWillReceive class="p-4" />
  </div>
</template>

<style lang="scss">
@import '@/styles/vars';

.root {
  border: 1px solid $gray5;
  border-radius: 8px;
}

.divider {
  background: $gray5;
  height: 1px;
}
</style>
