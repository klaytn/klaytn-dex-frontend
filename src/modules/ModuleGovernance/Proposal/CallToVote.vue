<script setup lang="ts" name="ModuleGovernanceProposalCallToVote">
import { Proposal } from '../types'
import CONFIG from '~config'

const { t } = useI18n()
const vBem = useBemClass()

const props = defineProps<{
  proposal: Proposal
}>()
const { proposal } = toRefs(props)

const href = computed(() => {
  return `https://snapshot.org/#/${CONFIG.snapshotSpace}/proposal/${proposal.value.id}`
})
</script>

<template>
  <div v-bem>
    <span v-bem="'call'">
      {{ t('ModuleGovernanceProposalCallToVote.call') }}
    </span>
    <a
      :href="href"
      target="_blank"
    >
      <KlayButton
        v-bem="'vote'"
        target="_blank"
        type="primary"
      >
        {{ t('ModuleGovernanceProposalCallToVote.vote') }}
      </KlayButton>
    </a>
  </div>
</template>

<style lang="sass">
@use '@/styles/vars'

.module-governance-proposal-call-to-vote
  display: flex
  flex-direction: column
  padding: 24px
  margin-bottom: 24px
  background: vars.$gray6
  border-radius: 8px
  text-align: center
  @media only screen and (min-width: vars.$md)
    text-align: left
  &__call
    font-size: 20px
    font-weight: 600
  &__vote
    width: 100%
    margin-top: 16px
    @media only screen and (min-width: vars.$md)
      width: 240px
</style>
