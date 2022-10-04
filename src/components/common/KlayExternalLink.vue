<script setup lang="ts">
import { KlayIconLink } from '~klay-icons'

defineProps<{
  href: string
}>()
</script>

<template>
  <a
    target="_blank"
    :href="href"
    class="inline-flex items-center space-x-1"
  >
    <span>
      <slot />
    </span>

    <KlayIconLink class="icon-link" />
  </a>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

a {
  &:hover {
    &,
    & > * {
      color: vars.$blue;
    }
  }
}

.icon-link {
  color: vars.$gray3;
}
</style>
