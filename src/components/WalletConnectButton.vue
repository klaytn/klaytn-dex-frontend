<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
    type?: 'primary' | 'secondary'
  }>(),
  {
    size: 'sm',
    type: 'primary',
  },
)

const dexStore = useDexStore()
</script>

<template>
  <KlayButton
    class="button"
    :type="type"
    :size="props.size"
    @click="dexStore.openModal = true"
  >
    Connect Wallet
  </KlayButton>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.button.s-button_type_secondary {
  background-color: vars.$blue-light3;
  color: vars.$blue;
  box-shadow: none;
  &:hover {
    background-color: vars.$blue-light4;
  }
  &:active {
    background-color: vars.$blue-light4;
  }
}
</style>
