<script setup lang="ts">
const assetsStore = useAssetsStore()
const show = toRef(assetsStore, 'openReceiveModal')

const dexStore = useDexStore()
</script>

<template>
  <ModalAddressQRCode
    :address="show ? dexStore.account : null"
    @close="show = false"
  >
    <template #title>
      Receive any token
    </template>
  </ModalAddressQRCode>
</template>
