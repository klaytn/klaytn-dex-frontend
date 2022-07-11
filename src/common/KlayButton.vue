<script setup lang="ts" name="KlayButton">
import { KlayButton } from '@soramitsu-ui/ui'
</script>

<template>
  <KlayButton
    class="klay-button"
    v-bind="$attrs"
  >
    <slot />

    <template #icon>
      <slot name="icon" />
    </template>
  </KlayButton>
</template>

<style lang="scss">
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
  }
  &_size_lg {
    border-radius: 16px;
  }
}
</style>
