<script setup lang="ts" name="ModuleGovernanceProposal">
import { Address } from '@/core/kaikas';
import { POSITIVE_CHOICES } from '../const'
import { useProposalQuery } from '../query.proposal'
import { Proposal, ProposalState } from '../types'

const vBem = useBemClass()
const route = useRoute()

const proposalId = computed(() => route.params.id as Address)

const ProposalQuery = useProposalQuery(proposalId)
const rawProposal = computed(() => {
  return ProposalQuery.result.value?.proposal ?? null
})

const proposal = computed<Proposal | null>(() => {
  if (rawProposal.value === null) return null

  const { id, title, start, end, choices, scores, body } = rawProposal.value
  let state: ProposalState | null = null
  if (rawProposal.value.state === 'active')
    state = ProposalState.Active
  else {
    const positiveChoices = POSITIVE_CHOICES.map(choice => choice.toLocaleLowerCase())
    const proposalChoicesInLowerCase = [...choices].map(choice => choice.toLowerCase())
    const hasPositiveChoice = positiveChoices.some(positiveChoice => proposalChoicesInLowerCase.includes(positiveChoice))
    if (hasPositiveChoice) {
      const maxScore = Math.max(...scores)
      const resultChoice = choices[scores.indexOf(maxScore)]
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
    state,
    choices,
    scores,
    body,
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
      v-bem="'body'"
    >
      <div v-bem="'content'">
        <ModuleGovernanceProposalCallToVote :proposal="proposal" />
        <ModuleGovernanceProposalDescription :proposal="proposal" />
        <ModuleGovernanceProposalVotes :proposal="proposal" />
      </div>
      <ModuleGovernanceProposalSideColumn :proposal="proposal" />
    </div>
    <div
      v-if="loading"
      v-bem="'loader'"
    >
      <KlayLoader />
    </div>
  </div>
</template>

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
  &__body
    display: flex
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
