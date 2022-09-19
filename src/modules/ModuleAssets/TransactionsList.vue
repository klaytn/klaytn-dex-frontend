<script setup lang="ts">
import { storeToRefs } from 'pinia'

const store = useAssetsStore()
const { transactions } = storeToRefs(store)
</script>

<template>
  <div class="overflow-y-scroll">
    <template v-if="!transactions">
      no txs
    </template>
    <template v-else>
      <template
        v-for="(x, i) in transactions"
        :key="x.id"
      >
        <hr
          v-if="i > 0"
          class="klay-divider my-0 mx-4 !w-auto"
        >

        <ModuleAssetsTransactionsListItem
          :item="x"
          @click="store.openDetailsForTransaction = x"
        />
      </template>
    </template>
  </div>
</template>
