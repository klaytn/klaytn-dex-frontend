<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<script setup lang="ts">
import { TransactionEnum } from '../query.transactions'
import ListItem from './TransactionsListItem.vue'
import TransactionDetailsModal from './TransactionDetailsModal.vue'
import { mergeProps } from 'vue'
import { ITEM_HEIGHT } from '../const'

const props = defineProps<{
  transactions: TransactionEnum[] | null
  loading?: boolean
}>()

const emit = defineEmits(['load-more'])

const openDetailsFor = shallowRef<null | TransactionEnum>(null)

const {
  list: virtualList,
  containerProps,
  wrapperProps,
} = useVirtualList(
  computed(() => props.transactions ?? []),
  { itemHeight: ITEM_HEIGHT },
)

useInfiniteScroll(containerProps.ref, () => emit('load-more'), { distance: ITEM_HEIGHT / 2 })
</script>

<template>
  <div
    v-bind="mergeProps($attrs, containerProps)"
    class="overflow-y-scroll"
  >
    <div
      v-if="!transactions?.length"
      class="p-4 text-center no-results"
    >
      No transactions
    </div>

    <div
      v-else
      v-bind="wrapperProps"
      class="relative"
    >
      <ListItem
        v-for="x in virtualList"
        :key="x.index"
        height="56"
        :item="x.data"
        @click="openDetailsFor = x.data"
      />

      <div
        v-if="loading"
        class="absolute bottom-0 left-0 right-0 flex justify-end"
      >
        <div class="p-1 rounded-full bg-white shadow-lg border border-gray-100 m-4">
          <KlayLoader size="24" />
        </div>
      </div>
    </div>
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
