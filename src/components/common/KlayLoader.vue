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
@use '@/styles/vars';

.color-blue {
  color: vars.$blue;
}

.color-gray {
  color: vars.$gray2;
}
</style>
