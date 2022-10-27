<script setup lang="ts">
import { KlayIconCopy } from '~klay-icons'
import IcRoundCheck from '~icons/ic/round-check'

defineProps<{
  check?: boolean
}>()
</script>

<template>
  <IcRoundCheck v-if="check" />
  <KlayIconCopy v-else />
</template>

<style lang="scss" scoped>
* {
  height: 1em;
}
</style>
