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
@use '@/styles/vars';

.klay-button.s-button {
  border-radius: 8px;
  &_type_primary {
    background-color: vars.$blue;
    &:hover {
      background-color: vars.$blue-light1;
    }
    &:active {
      background-color: vars.$blue-dark;
    }
  }
  &_type_primary.s-button_disabled {
    background-color: vars.$gray4;
  }
  &_type_secondary {
    background: vars.$white;
    box-shadow: 0px 2px 6px 0px rgba(0, 0, 0, 0.15);
    transition: 150ms color ease;
    &.s-button_disabled {
      background: vars.$white;
      color: vars.$gray4;
    }
    &:not(.s-button_disabled) {
      &:hover,
      &:active {
        color: vars.$blue;
        background: vars.$white;
      }
    }
  }
  &_size_lg {
    border-radius: 16px;
  }
}
</style>
