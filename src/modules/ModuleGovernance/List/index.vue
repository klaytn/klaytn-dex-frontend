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

const ProposalsQuery = useProposalsQuery(computed(() => ({
  onlyActive: onlyActive.value,
  skip: 0,
  orderBy: sorting.value,
  query: searchQuery.value
})))
const rawProposals = computed(() => {
  return ProposalsQuery.result.value?.proposals ?? null
})

const proposals = computed<ListProposal[] | null>(() => {
  if (rawProposals.value === null) return null

  return rawProposals.value.map(rawProposal => {
    const { id, title, start, end, state, scores, choices } = rawProposal
    const status = getProposalStatus({ state, scores, choices })
    return {
      id,
      title,
      start,
      end,
      status
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
      query: searchQuery.value
    },
    // Transform the previous result with new data
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult
      showViewMore.value = fetchMoreResult.proposals.length !== 0
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
      v-if="loading && !showViewMore"
      v-bem="'loader'"
    >
      <KlayLoader />
    </div>
  </div>
</template>

<style lang="sass">
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
