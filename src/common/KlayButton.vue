<script setup lang="ts" name="KlayButton">
import { SButton } from '@soramitsu-ui/ui'
</script>

<template>
  <SButton
    class="klay-button"
    v-bind="$attrs"
  >
    <slot />

    <template #icon>
      <slot name="icon" />
    </template>
  </SButton>
</template>

<style lang="scss">
@import '@/styles/vars';

.klay-button.s-button {
  border-radius: 8px;
  &_type_primary {
    background-color: $blue;
    &:hover {
      background-color: $blue-light1;
    }
    &:active {
      background-color: $blue-dark;
    }
  }
  &_type_primary.s-button_disabled {
    background: $gray4;
  }
  &_type_secondary {
    background: $white;
    box-shadow: 0px 2px 6px 0px rgba(0, 0, 0, 0.15);
    color: $blue;

    &.s-button_disabled {
      background: $white;
      color: $gray4;
    }
    &:not(.s-button_disabled) {
      &:hover,
      &:active {
        color: $blue;
        background: $white;
      }
    }
  }
  &_size_lg {
    border-radius: 16px;
  }
}
</style>
