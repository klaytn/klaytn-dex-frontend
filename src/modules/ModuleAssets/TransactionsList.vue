<script setup lang="ts">
import { storeToRefs } from 'pinia'
import ListItem from './TransactionsListItem.vue'

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

        <ListItem
          :item="x"
          @click="store.openDetailsForTransaction = x"
        />
      </template>
    </template>
  </div>
</template>
