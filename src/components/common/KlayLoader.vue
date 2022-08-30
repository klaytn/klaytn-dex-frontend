<script setup lang="ts" name="KlayLoader">
import { SSpinner } from '@soramitsu-ui/ui'

withDefaults(
  defineProps<{
    size?: string | number
    width?: string | number
    color?: 'blue' | 'gray'
  }>(),
  {
    size: 36,
    color: 'blue',
    width: 4,
  },
)
</script>

<template>
  <SSpinner
    :class="`color-${color}`"
    v-bind="{ size, width }"
  />
</template>

<style scoped lang="scss">
@import '@/styles/vars';

.color-blue {
  color: $blue;
}

.color-gray {
  color: $gray2;
}
</style>
