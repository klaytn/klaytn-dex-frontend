<script setup lang="ts" name="ModuleGovernanceProposalStatus">
import { ProposalStatus } from './types'

const { t } = useI18n()
const vBem = useBemClass()

const props = defineProps<{
  status: ProposalStatus
}>()
const { status } = toRefs(props)
</script>

<template>
  <div v-bem="{ type: status }">
    {{ t(`common.proposalState.${status}`) }}
  </div>
</template>

<style lang="sass">
@use '@/styles/vars'

.module-governance-proposal-status
  display: flex
  justify-content: center
  align-items: center
  flex-shrink: 0
  width: 96px
  height: 32px
  font-weight: 500
  border: 2px solid
  border-radius: 8px
  font-size: 14px
  &--type
    &--active
      color: vars.$blue
    &--executed
      color: vars.$green
      border-color: vars.$green
    &--defeated
      color: vars.$red
      border-color: vars.$red
</style>
