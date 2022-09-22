<script setup lang="ts">
import { useTransactionsQueryByAccount } from './query.transactions'
import TransactionsList from './components/TransactionsList.vue'

const dexStore = useDexStore()

const {
  load,
  enumerated: transactions,
  loading,
  fetchMore,
} = useTransactionsQueryByAccount({ account: toRef(dexStore, 'account') })

load()
</script>

<template>
  <TransactionsList
    :transactions="transactions"
    :loading="loading"
    @load-more="fetchMore"
  />
</template>
