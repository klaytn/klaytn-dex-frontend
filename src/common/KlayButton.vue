<script setup lang="ts" name="KlayButton">
import { SButton } from '@soramitsu-ui/ui'
</script>

<template>
  <SButton v-bind="$attrs">
    <slot />
  </SButton>
</template>
