<script setup lang="ts" name="ModuleGovernanceProposalVotes">
import { formatAddress } from '@/core/kaikas'
import { PAGE_SIZE } from '../const'
import { useVotesQuery } from '../query.votes'
import { Proposal } from '../types'

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
const showViewMore = ref(true)

const VotesQuery = useVotesQuery(computed(() => ({
  skip: 0,
  proposalId: proposal.value.id
})))
const votes = computed(() => {
  return VotesQuery.result.value?.votes ?? null
})

const loading = VotesQuery.loading

function viewMore() {
  page.value++

  VotesQuery.fetchMore({
    // New variables
    variables: {
      skip: skip.value,
      proposalId: proposal.value.id
    },
    // Transform the previous result with new data
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult
      showViewMore.value = fetchMoreResult.votes.length !== 0
      return {
        votes: [...previousResult.votes, ...fetchMoreResult.votes],
      }
    },
  })
}
</script>

<template>
  <KlayAccordionItem
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
            <span v-bem="'vote-vp'">{{ vote.vp }}</span>
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
        v-if="loading && !showViewMore"
        v-bem="'loader'"
      >
        <KlayLoader />
      </div>
    </div>
  </KlayAccordionItem>
</template>

<style lang="sass">
@import '@/styles/vars.sass'

$padding-bottom: 19px

.module-governance-proposal-votes
  &__title
    font-size: 20px
    font-weight: 600
  &__content
    flex: 1
    display: flex
    flex-direction: column
    padding: 0 16px
    padding-bottom: $padding-bottom
    border: 1px solid $gray5
    border-radius: 8px
  &__vote
    position: relative
    display: flex
    justify-content: space-between
    align-items: center
    height: 54px
    border-bottom: 1px solid $gray5
    &-voter, &-vp
      width: calc(50% - 150px)
    &-vp
      text-align: right
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
