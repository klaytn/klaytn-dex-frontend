<script setup lang="ts">
import { SSwitch } from '@soramitsu-ui/ui'
</script>

<template>
  <SSwitch class="klay-switch" />
</template>

<style lang="scss">
@use '@/styles/vars';

.klay-switch.s-switch {
  .s-switch {
    &__button {
      background-color: vars.$gray5 !important;
      &,
      &:before {
        transition: 250ms ease !important;
      }
      &:checked,
      &:hover {
        background-color: vars.$blue !important;
      }
    }
    &__label {
      margin-left: 10px;
      font-weight: 700;
      font-size: 14px;
    }
  }
}
</style>
