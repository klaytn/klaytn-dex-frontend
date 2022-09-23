<script setup lang="ts">
import { useTransactionsQueryByAccount } from './query.transactions'
import TransactionsList from './components/TransactionsList.vue'

const dexStore = useDexStore()
const assetsStore = useAssetsStore()

const {
  load,
  enumerated: transactions,
  loading,
  fetchMore,
  refetch,
} = useTransactionsQueryByAccount({ account: toRef(dexStore, 'account') })

load()

assetsStore.useRefreshButton(
  reactive({
    loading,
    onClick: () => refetch(),
  }),
)
</script>

<template>
  <TransactionsList
    :transactions="transactions"
    :loading="loading"
    @load-more="fetchMore"
  />
</template>
