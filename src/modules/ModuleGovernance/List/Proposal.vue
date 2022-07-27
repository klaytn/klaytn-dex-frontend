<script setup lang="ts" name="ModuleGovernanceListProposal">
import dayjs from 'dayjs'
import { RouteName } from '@/types'
import { Proposal } from '../types'

const { t } = useI18n()
const vBem = useBemClass()

const props = defineProps<{
  proposal: Proposal
}>()
const { proposal } = toRefs(props)

function formatDate(timestamp: number) {
  return dayjs(timestamp * 1000).format('DD.MM.YYYY')
}

const formattedStartDate = computed(() => {
  return formatDate(proposal.value.start)
})

const formattedEndDate = computed(() => {
  return formatDate(proposal.value.end)
})
</script>

<template>
  <router-link
    v-bem
    :to="{ name: RouteName.VotingProposal, params: { id: proposal.id } }"
  >
    <div v-bem="'item'">
      <div v-bem="'item-label'">
        {{ t('ModuleGovernanceListProposal.startDate') }}
      </div>
      <div v-bem="'item-value'">
        {{ formattedStartDate }}
      </div>
    </div>
    <div v-bem="'title'">
      {{ proposal.title }}
    </div>
    <div v-bem="'item'">
      <div v-bem="'item-label'">
        {{ t('ModuleGovernanceListProposal.endDate') }}
      </div>
      <div v-bem="'item-value'">
        {{ formattedEndDate }}
      </div>
    </div>
    <ModuleGovernanceProposalStatus :status="proposal.status" />
  </router-link>
</template>

<style lang="sass">
@import '@/styles/vars.sass'

.module-governance-list-proposal
  display: flex
  align-items: center
  height: 80px
  padding: 0 24px
  border-top: 2px solid $gray6
  border-bottom: 2px solid $gray6
  transition: 250ms ease background-color
  & + &
    margin-top: -2px
  &:hover
    background-color: $gray7
  &__item
    position: relative
    width: 100px
    margin-right: 32px
    &-label
      position: absolute
      bottom: calc(100% + 4px)
      font-size: 12px
      color: $gray2
      line-height: 14px
    &-value
      line-height: 20px
      font-weight: 500
  &__title
    flex: 1
    margin-right: 32px
    font-weight: 500
</style>