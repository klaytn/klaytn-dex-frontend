<route lang="yaml">
name: Transactions
path: /transactions
</route>

<script setup lang="ts">
const store = useAssetsStore()

store.loadTransactions()
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="px-4 pb-4">
      <KlayTextField label="Search by... addr? block hash? type? symbol?" />
    </div>

    <hr class="klay-divider my-0">

    <ModuleAssetsTransactionsList class="flex-1" />
  </div>

  <ModuleAssetsTransactionDetailsModal
    :item="store.openDetailsForTransaction"
    @close="store.openDetailsForTransaction = null"
  />
</template>
