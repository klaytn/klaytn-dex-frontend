<script setup lang="ts" name="ModuleGovernanceProposalVotes">
import { formatAddress } from '@/core'
import { PAGE_SIZE } from '../const'
import { useVotesQuery } from '../query.votes'
import { Proposal } from '../types'
import { formatAmount } from '../utils'

const { t } = useI18n()
const vBem = useBemClass()

const props = defineProps<{
  proposal: Proposal
}>()
const { proposal } = toRefs(props)

const page = ref(1)
const skip = computed(() => {
  return (page.value - 1) * PAGE_SIZE
})
const expanded = ref(true)
const showViewMore = ref(true)

const VotesQuery = useVotesQuery(
  computed(() => ({
    skip: 0,
    proposalId: proposal.value.id,
  })),
)
const votes = computed(() => {
  return VotesQuery.result.value?.votes ?? null
})

function setInitShowViewMore() {
  if (!VotesQuery.result.value) return
  showViewMore.value = VotesQuery.result.value.votes.length === PAGE_SIZE * page.value
}
setInitShowViewMore()
VotesQuery.onResult(() => {
  setInitShowViewMore()
})

const loading = VotesQuery.loading

function viewMore() {
  page.value++

  VotesQuery.fetchMore({
    // New variables
    variables: {
      skip: skip.value,
      proposalId: proposal.value.id,
    },
    // Transform the previous result with new data
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult
      return {
        votes: [...previousResult.votes, ...fetchMoreResult.votes],
      }
    },
  })
}
</script>

<template>
  <KlayAccordionItem
    v-model="expanded"
    v-bem
    type="light"
  >
    <template #title>
      <span v-bem="'title'">
        {{ t('ModuleGovernanceProposalVotes.title') }}
      </span>
    </template>
    <div v-bem="'content'">
      <template v-if="votes">
        <div v-bem="'list'">
          <div
            v-for="vote in votes"
            :key="vote.id"
            v-bem="'vote'"
          >
            <span v-bem="'vote-voter'">{{ formatAddress(vote.voter) }}</span>
            <span v-bem="'vote-choice'">{{ proposal.choices[vote.choice - 1] }}</span>
            <span v-bem="'vote-vp'">{{ formatAmount(vote.vp) }}</span>
          </div>
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
        v-if="loading && (!showViewMore || !votes)"
        v-bem="'loader'"
      >
        <KlayLoader />
      </div>
      <div
        v-else-if="!votes?.length"
        v-bem="'empty'"
      >
        There are no votes yet
      </div>
    </div>
  </KlayAccordionItem>
</template>

<style lang="sass">
@use '@/styles/vars'

.module-governance-proposal-votes
  &__title
    font-size: 20px
    font-weight: 600
  &__content
    flex: 1
    display: flex
    flex-direction: column
    padding: 0 16px
    border: 1px solid vars.$gray5
    border-radius: 8px
  &__vote
    position: relative
    display: flex
    justify-content: space-between
    align-items: center
    height: 54px
    &+&
      border-top: 1px solid vars.$gray5
    &-voter, &-vp
      width: calc(50% - 150px)
    &-voter
      min-width: 65px
    &-vp
      display: flex
      justify-content: flex-end
  &__view-more
    display: flex
    justify-content: center
    width: 100%
    padding: 8px 0
    border-top: 1px solid #DFE4ED
  &__loader
    flex: 1
    display: flex
    justify-content: center
    align-items: center
    min-height: 82px
  &__empty
    display: flex
    justify-content: center
    align-items: center
    width: 100%
    height: 82px
    color: vars.$gray3
</style>
