<script setup lang="ts">
import { STextField } from '@soramitsu-ui/ui'
</script>

<template>
  <STextField>
    <template #default>
      <slot />
    </template>
    <template #append>
      <slot name="append" />
    </template>
  </STextField>
</template>

<style lang="scss">
@import '@/styles/vars';

.s-text-field {
  &__input-wrapper {
    background: $gray6;
    border-radius: 8px;
    border: 1px solid transparent;
    transition: 250ms ease border-color;
  }

  &:hover &__input-wrapper:not(:focus-within) {
    background: $gray6;
    border: 1px solid $blue-light3;
  }

  &__input-wrapper:focus-within {
    background: $blue-light4;
    border: 1px solid $blue-light3;
  }

  .s-select-input {
    border-radius: 8px;
    background: $gray6 !important;
    border: 1px solid transparent;
    transition: 250ms ease border-color;
  }

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
</style>
