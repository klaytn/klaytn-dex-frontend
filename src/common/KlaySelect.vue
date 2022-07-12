<script setup lang="ts">
import { SSelect } from '@soramitsu-ui/ui'
</script>

<template>
  <SSelect class="klay-select" />
</template>

<style lang="scss">
@import '@/styles/vars';

.klay-select {
  .s-select-input {
    border-radius: 8px;
    background: $gray6 !important;
    border: 1px solid transparent;
    transition: 250ms ease border-color;
    &:hover {
      background: $gray6;
      border: 1px solid $blue-light3;
    }
    svg {
      transition: 250ms ease;
    }
    &:hover svg {
      color: $blue;
    }
  }

  .s-select-dropdown {
    border-radius: 8px;
    .s-select-option__content {
      font-size: 14px;
    }
  }
}
</style>
