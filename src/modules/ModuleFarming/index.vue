<script setup lang="ts" name="FarmingModule">
import { Pool } from './types'
import { PAGE_SIZE } from './const'

const vBem = useBemClass()

const farmingStore = useFarmingStore()
farmingStore.setupQueries()
const queries = farmingStore.useQueryScopeAnyway()
const { sortedPools, farming, isLoading } = toRefs(queries)

const page = ref(1)

const showViewMore = computed(() => {
  if (sortedPools.value === null) return false

  return sortedPools.value.length > page.value * PAGE_SIZE
})

function viewMore() {
  page.value++
}

const paginatedPools = computed<Pool[] | null>(() => {
  if (sortedPools.value === null) return null

  return sortedPools.value.slice(0, page.value * PAGE_SIZE)
})
</script>

<template>
  <div v-bem>
    <template v-if="farming">
      <div v-bem="'list'">
        <ModuleFarmingPool
          v-for="pool in paginatedPools"
          :key="pool.id"
          :pool="pool"
          @staked="(value: string) => queries.handleStaked(pool, value)"
          @unstaked="(value: string) => queries.handleUnstaked(pool, value)"
        />
      </div>
      <div
        v-if="showViewMore"
        v-bem="'view-more'"
      >
        <KlayButton
          v-bem="'view-more-button'"
          size="sm"
          type="primary"
          :loading="isLoading"
          @click="viewMore"
        >
          View more
        </KlayButton>
      </div>
    </template>
    <div
      v-if="isLoading && !showViewMore"
      v-bem="'loader'"
    >
      <KlayLoader />
    </div>
  </div>
</template>

<style lang="sass">
$padding-bottom: 19px

.farming-module
  flex: 1
  display: flex
  flex-direction: column
  padding-bottom: $padding-bottom
  &__view-more
    display: flex
    justify-content: center
    width: 100%
    padding: 8px 0
    margin-bottom: - $padding-bottom
  &__loader
    flex: 1
    display: flex
    justify-content: center
    align-items: center
    min-height: 82px + $padding-bottom
    margin-bottom: - $padding-bottom
</style>
