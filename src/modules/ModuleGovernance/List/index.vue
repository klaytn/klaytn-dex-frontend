<script setup lang="ts" name="ModuleGovernanceList">
import { PAGE_SIZE, POSITIVE_CHOICES } from '../const'
import { useProposalsQuery } from '../query.proposals'
import { useGovernanceStore } from '../store/governance'
import { ListProposal, ProposalState } from '../types'

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
    const { id, title, start, end } = rawProposal
    let state: ProposalState | null = null
    if (rawProposal.state === 'active')
      state = ProposalState.Active
    else {
      const positiveChoices = POSITIVE_CHOICES.map(choice => choice.toLocaleLowerCase())
      const proposalChoicesInLowerCase = [...rawProposal.choices].map(choice => choice.toLowerCase())
      const hasPositiveChoice = positiveChoices.some(positiveChoice => proposalChoicesInLowerCase.includes(positiveChoice))
      if (hasPositiveChoice) {
        const maxScore = Math.max(...rawProposal.scores)
        const resultChoice = rawProposal.choices[rawProposal.scores.indexOf(maxScore)]
        if (positiveChoices.includes(resultChoice.toLocaleLowerCase()))
          state = ProposalState.Executed
        else
          state = ProposalState.Defeated
      } else
        state = ProposalState.Finished
    }
    return {
      id,
      title,
      start,
      end,
      state
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
