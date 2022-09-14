<script setup lang="ts">
const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<(e: 'update:show', value: boolean) => void>()

const showModel = useVModel(props, 'show', emit)

const dexStore = useDexStore()
</script>

<template>
  <ModalAddressQRCode
    :address="showModel ? dexStore.account : null"
    @close="showModel = false"
  >
    <template #title>
      Receive any token
    </template>
  </ModalAddressQRCode>
</template>
