<script setup lang="ts">
import { Address } from '@/core'

const props = defineProps<{
  address: Address
}>()

const { copy } = useClipboard()
const copied = autoResetRef(false, 1000)

async function copyAddress() {
  await copy(props.address)
  copied.value = true
}
</script>

<template>
  <div
    class="addr flex items-center space-x-1"
    @click="copyAddress"
  >
    <div class="flex-1 truncate">
      {{ address }}
    </div>
    <IconCopyCheck
      :check="copied"
      class="icon"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.addr {
  cursor: pointer;

  .icon {
    color: #adb9ce;
  }

  &:hover,
  &:hover .icon {
    color: vars.$blue;
  }
}
</style>
