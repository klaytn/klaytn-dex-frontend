<script setup lang="ts">
import cssRows from '../ModuleTradeShared/rows.module.scss'
</script>

<template>
  <div class="root py-4 space-y-4">
    <div class="px-4 space-y-4">
      <div :class="[cssRows.rowSm]">
        <span>Price</span>
        <span>?</span>
      </div>
      <div :class="[cssRows.rowSm]">
        <span>Minimum received</span>
        <span>?</span>
      </div>
      <div :class="[cssRows.rowSm, cssRows.rowSmDimmed]">
        <span>Price Impact</span>
        <span>?</span>
      </div>
      <div :class="[cssRows.rowSm, cssRows.rowSmDimmed]">
        <span>Network + LP Fee</span>
        <span>?</span>
      </div>
    </div>

    <div class="klay-divider" />

    <p class="px-4 note">
      Output is estimated. You will receive at least <i>... XXX</i>
      or the transacction will revert
    </p>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

.root {
  border: 1px solid $gray5;
  border-radius: 8px;
}

.note {
  font-weight: 500;
  font-size: 12px;
  line-height: 180%;
  color: #8b93a1;
}
</style>