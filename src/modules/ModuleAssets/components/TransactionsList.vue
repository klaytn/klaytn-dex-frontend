<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<script setup lang="ts">
import { TransactionEnum } from '../query.transactions'
import ListItem from './TransactionsListItem.vue'
import TransactionDetailsModal from './TransactionDetailsModal.vue'

const props = defineProps<{
  transactions: TransactionEnum[] | null
  loading?: boolean
}>()

const openDetailsFor = shallowRef<null | TransactionEnum>(null)
</script>

<template>
  <div
    class="overflow-y-scroll"
    v-bind="$attrs"
  >
    <div
      v-if="loading"
      class="p-4 flex justify-center"
    >
      <KlayLoader />
    </div>

    <div
      v-else-if="!transactions?.length"
      class="p-4 text-center no-results"
    >
      No transactions
    </div>

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
          @click="openDetailsFor = x"
        />
      </template>
    </template>
  </div>

  <TransactionDetailsModal
    :item="openDetailsFor"
    @close="openDetailsFor = null"
  />
</template>

<style scoped lang="scss">
@use '@/styles/vars';

.no-results {
  font-size: 14px;
  color: vars.$gray2;
}
</style>
