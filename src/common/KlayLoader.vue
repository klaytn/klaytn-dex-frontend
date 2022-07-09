<script setup lang="ts" name="KlayLoader">
import { SSpinner } from '@soramitsu-ui/ui'

const props = withDefaults(
  defineProps<{
    size?: string | number
    width?: string | number
  }>(),
  {
    size: 36,
  },
)
</script>

<template>
  <SSpinner
    class="klay-loader"
    v-bind="{ size, width }"
  />
</template>

<style scoped lang="scss">
@import '@/styles/vars';

.klay-loader {
  color: $blue;
}
</style>
