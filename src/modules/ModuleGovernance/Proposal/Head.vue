<script setup lang="ts" name="ModuleGovernanceProposalHead">
import { Status } from '@soramitsu-ui/ui'
import { Proposal } from '../types'

const { t } = useI18n()
const vBem = useBemClass()

const props = defineProps<{
  proposal: Proposal
}>()
const { proposal } = toRefs(props)

function share() {
  navigator.clipboard.writeText(window.location.href)
  $notify({ status: Status.Success, description: 'Link was successfully copied' })
}
</script>

<template>
  <div v-bem>
    <span v-bem="'title'">
      {{ proposal.title }}
    </span>
    <KlayButton
      v-bem="'share'"
      size="sm"
      @click="share"
    >
      {{ t('ModuleGovernanceProposalHead.share') }}
    </KlayButton>
    <ModuleGovernanceProposalStatus :status="proposal.status" />
  </div>
</template>

<style lang="sass">
@import '@/styles/vars.sass'

.module-governance-proposal-head
  display: flex
  align-items: center
  justify-content: flex-start
  height: 74px
  padding: 0 16px 0 30px
  border-bottom: 1px solid $gray5
  &__title
    margin-right: auto
    font-size: 20px
    font-weight: 600
  &__share
    margin: 0 16px
</style>