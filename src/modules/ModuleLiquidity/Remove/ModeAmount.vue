<template>
  <div class="root">
    <ModuleLiquidityRemoveModeAmountPicker class="p-4" />
    <div class="divider" />
    <ModuleLiquidityRemoveModeAmountYouWillReceive class="p-4" />
  </div>
</template>

<style lang="scss" scoped>
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
