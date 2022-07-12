<script setup lang="ts">
import { SSwitch } from '@soramitsu-ui/ui'
</script>

<template>
  <SSwitch class="klay-switch" />
</template>

<style lang="scss">
@import '@/styles/vars';

.klay-switch.s-switch {
  &__button {
    background-color: $gray5 !important;
  }
  &,
  &:before {
    transition: 250ms ease !important;
  }
  &:checked,
  &:hover {
    background-color: $blue !important;
  }
}
</style>
