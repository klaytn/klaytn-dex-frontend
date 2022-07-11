<script setup lang="ts" name="KlayButton">
import { SButton } from '@soramitsu-ui/ui'
</script>

<template>
  <SButton v-bind="$attrs">
    <slot />

    <template #icon>
      <slot name="icon" />
    </template>
  </SButton>
</template>
