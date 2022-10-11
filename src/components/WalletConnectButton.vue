<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'sm' },
)

const dexStore = useDexStore()
</script>

<template>
  <KlayButton
    type="primary"
    :size="props.size"
    @click="dexStore.openModal = true"
  >
    Connect Wallet
  </KlayButton>
</template>
