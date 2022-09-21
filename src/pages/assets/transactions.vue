<script setup lang="ts">
const store = useAssetsStore()

store.loadTransactions()
</script>

<template>
  <div class="h-full flex flex-col">
    <ModuleAssetsTransactionsList class="flex-1" />
  </div>

  <ModuleAssetsTransactionDetailsModal
    :item="store.openDetailsForTransaction"
    @close="store.openDetailsForTransaction = null"
  />
</template>
