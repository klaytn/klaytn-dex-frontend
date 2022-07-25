<script setup lang="ts" name="ModuleGovernanceProposal">
import { Address, parseAddress } from '@/core/kaikas'
import { useProposalQuery } from '../query.proposal'
import { Proposal } from '../types'
import { getProposalStatus } from '../utils'

const vBem = useBemClass()
const route = useRoute()

const proposalId = computed(() => parseAddress(route.params.id as Address))

const ProposalQuery = useProposalQuery(proposalId)
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
    snapshot
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
    flex: 1
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
