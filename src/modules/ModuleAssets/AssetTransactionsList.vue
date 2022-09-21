<script setup lang="ts">
import { Address } from '@/core'
import { useTransactionsQueryByAccountAndAsset } from './query.transactions'
import TransactionsList from './components/TransactionsList.vue'

const props = defineProps<{
  id: Address
}>()

const dexStore = useDexStore()

const {
  enumerated: transactions,
  loading,
  load,
} = useTransactionsQueryByAccountAndAsset({
  account: toRef(dexStore, 'account'),
  asset: toRef(props, 'id'),
})

load()
</script>

<template>
  <TransactionsList
    :transactions="transactions"
    :loading="loading"
  />
</template>
