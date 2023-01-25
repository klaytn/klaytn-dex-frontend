<script setup lang="ts" name="ModuleGovernanceList">
import { PAGE_SIZE } from '../const'
import { useProposalsQuery } from '../query.proposals'
import { useGovernanceStore } from '../store/governance'
import { ListProposal } from '../types'
import { getProposalStatus } from '../utils'

const vBem = useBemClass()

const page = ref(1)
const skip = computed(() => {
  return (page.value - 1) * PAGE_SIZE
})
const showViewMore = ref(true)

const governanceStore = useGovernanceStore()
const { onlyActive, searchQuery, sorting } = toRefs(governanceStore)

const proposalsQueryProps = computed(() => ({
  onlyActive: onlyActive.value,
  skip: 0,
  orderBy: sorting.value,
  query: searchQuery.value,
}))
watch(proposalsQueryProps, () => {
  page.value = 1
})

const ProposalsQuery = useProposalsQuery(proposalsQueryProps)
const rawProposals = computed(() => {
  return ProposalsQuery.result.value?.proposals ?? null
})

const emptyText = computed(() => {
  if (onlyActive.value || searchQuery.value !== '') return 'There are no proposals matching the current filter'
  else return 'There are no proposals yet'
})

function setShowViewMore() {
  if (!ProposalsQuery.result.value) return
  showViewMore.value = ProposalsQuery.result.value.proposals.length === PAGE_SIZE * page.value
}
setShowViewMore()
ProposalsQuery.onResult(() => {
  setShowViewMore()
})

if (ProposalsQuery.result.value) page.value = Math.ceil(ProposalsQuery.result.value.proposals.length / PAGE_SIZE)

const proposals = computed<ListProposal[] | null>(() => {
  if (rawProposals.value === null) return null

  return rawProposals.value.map((rawProposal) => {
    const { id, title, start, end, state, scores, choices } = rawProposal
    const status = getProposalStatus({ state, scores, choices })
    return {
      id,
      title,
      start,
      end,
      status,
    }
  })
})

const loading = ProposalsQuery.loading

function viewMore() {
  page.value++

  ProposalsQuery.fetchMore({
    // New variables
    variables: {
      onlyActive: onlyActive.value,
      skip: skip.value,
      orderBy: sorting.value,
      query: searchQuery.value,
    },
    // Transform the previous result with new data
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult
      return {
        proposals: [...previousResult.proposals, ...fetchMoreResult.proposals],
      }
    },
  })
}
</script>

<template>
  <div v-bem>
    <template v-if="proposals">
      <div v-bem="'list'">
        <ModuleGovernanceListProposal
          v-for="proposal in proposals"
          :key="proposal.id"
          :proposal="proposal"
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
          :loading="loading"
          @click="viewMore"
        >
          View more
        </KlayButton>
      </div>
    </template>
    <div
      v-if="loading && (!showViewMore || !proposals)"
      v-bem="'loader'"
    >
      <KlayLoader />
    </div>
    <div
      v-else-if="!proposals?.length"
      v-bem="'empty'"
      class="flex-1 w-full flex justify-center items-center p-4 text-center"
      :class="$style.empty"
    >
      {{ emptyText }}
    </div>
  </div>
</template>

<style lang="scss" module>
@use '@/styles/vars';

.empty {
  color: vars.$gray3;
}
</style>

<style lang="sass">
@use '@/styles/vars'

$padding-bottom: 19px

.module-governance-list
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
