<script setup lang="ts" name="ModuleGovernanceProposalCallToVote">
import { Status } from '@soramitsu-ui/ui'
import { Proposal } from '../types'

const { t } = useI18n()
const vBem = useBemClass()

const props = defineProps<{
  proposal: Proposal
}>()
const { proposal } = toRefs(props)

const href = computed(() => {
  return `https://snapshot.org/#/${import.meta.env.VITE_APP_SNAPSHOT_SPACE}/proposal/${proposal.value.id}`
})
</script>

<template>
  <div v-bem>
    <span v-bem="'call'">
      {{ t('ModuleGovernanceProposalCallToVote.call') }}
    </span>
    <a :href="href">
      <KlayButton
        v-bem="'vote'"
        type="primary"
      >
        {{ t('ModuleGovernanceProposalCallToVote.vote') }}
      </KlayButton>
    </a>
  </div>
</template>

<style lang="sass">
@import '@/styles/vars.sass'

.module-governance-proposal-call-to-vote
  display: flex
  flex-direction: column
  padding: 24px
  margin-bottom: 24px
  background: $gray6
  border-radius: 8px
  &__call
    font-size: 20px
    font-weight: 600
  &__vote
    width: 240px
    margin-top: 16px
</style>