<script setup lang="ts" name="ModuleGovernanceProposal">
import { useProposalQuery } from '../query.proposal'
import { Proposal } from '../types'
import { getProposalStatus } from '../utils'

const vBem = useBemClass()
const route = useRoute()

const proposalId = route.params.id

if (typeof proposalId !== 'string') throw new Error('Wrong id parameter')

const ProposalQuery = useProposalQuery(computed(() => proposalId))
const rawProposal = computed(() => {
  return ProposalQuery.result.value?.proposal ?? null
})

const proposal = computed<Proposal | null>(() => {
  if (rawProposal.value === null) return null

  const { id, title, state, start, end, choices, scores, scores_total, body, author, snapshot } = rawProposal.value
  const status = getProposalStatus({ state, scores, choices })
  return {
    id,
    title,
    start,
    end,
    status,
    choices,
    scores,
    scoresTotal: scores_total,
    body,
    author,
    snapshot,
  }
})

const loading = ProposalQuery.loading
</script>

<template>
  <div v-bem>
    <ModuleGovernanceProposalHead
      v-if="proposal"
      :proposal="proposal"
    />
    <div
      v-if="proposal"
      class="flex flex-1 lt-md:flex-col"
    >
      <div v-bem="'content'">
        <div :class="$style.section">
          <ModuleGovernanceProposalCallToVote :proposal="proposal" />
          <ModuleGovernanceProposalDescription :proposal="proposal" />
        </div>
        <div :class="$style.section">
          <ModuleGovernanceProposalVotes :proposal="proposal" />
        </div>
      </div>
      <div
        :class="$style.details"
        class="lt-md:order-first lt-md:w-full md:w-300px flex flex-col flex-shrink-0 min-height-[100%] p-6"
      >
        <div :class="$style.section">
          <ModuleGovernanceProposalChoices :proposal="proposal" />
        </div>
        <div :class="$style.section">
          <ModuleGovernanceProposalDates :proposal="proposal" />
        </div>
        <div :class="$style.section">
          <ModuleGovernanceProposalLinks :proposal="proposal" />
        </div>
      </div>
    </div>
    <div
      v-if="loading"
      v-bem="'loader'"
    >
      <KlayLoader />
    </div>
  </div>
</template>

<style lang="scss" module>
@use '@/styles/vars';

.details {
  border-bottom: 1px solid vars.$gray5;
  @media only screen and (min-width: vars.$md) {
    border-bottom: none;
    border-left: 1px solid vars.$gray5;
  }
}

.section {
  padding-bottom: 1.5rem;
  & + & {
    padding-top: 1.5rem;
    border-top: 1px solid vars.$gray5;
  }
}
</style>

<style lang="sass">
.module-governance-proposal
  display: flex
  flex-direction: column
  border-radius: 20px
  overflow: visible
  margin: auto
  max-width: 1190px
  width: 100%
  min-height: calc(100vh - 204px)
  background: linear-gradient(0deg, #ffffff, #ffffff), linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 100%), rgba(255, 255, 255, 0.6)
  box-shadow: 0px 20px 40px rgba(0, 0, 0, 0.05)
  .s-accordion-item__trigger
    min-height: auto !important
    padding-bottom: 26px !important
  &__content
    flex: 1
    min-width: 0
    padding: 24px
  &__loader
    flex: 1
    display: flex
    justify-content: center
    align-items: center
    min-height: 100%
</style>
