<template>
  <div class="root">
    <ModuleLiquidityRemoveModeAmountPicker class="p-4" />
    <div class="klay-divider" />
    <ModuleLiquidityRemoveModeAmountYouWillReceive class="p-4" />
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.root {
  border: 1px solid vars.$gray5;
  border-radius: 8px;
}
</style>
