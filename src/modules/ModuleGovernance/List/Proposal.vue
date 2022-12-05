<script setup lang="ts" name="ModuleGovernanceListProposal">
import dayjs from 'dayjs'
import { RouteName } from '@/types'
import { Proposal } from '../types'

const { t } = useI18n()

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
  <RouterLink
    :class="$style.proposal"
    class="flex lt-md:flex-col gap-3 md:gap-4 md:items-center py-4 px-6"
    :to="{ name: RouteName.VotingProposal, params: { id: proposal.id } }"
  >
    <div :class="$style.item">
      <div :class="$style.itemLabel">
        {{ t('ModuleGovernanceListProposal.startDate') }}
      </div>
      <div :class="$style.itemValue">
        {{ formattedStartDate }}
      </div>
    </div>
    <div class="flex-1 lt-md:order-first font-medium">
      {{ proposal.title }}
    </div>
    <div :class="$style.item">
      <div :class="$style.itemLabel">
        {{ t('ModuleGovernanceListProposal.endDate') }}
      </div>
      <div :class="$style.itemValue">
        {{ formattedEndDate }}
      </div>
    </div>
    <ModuleGovernanceProposalStatus :status="proposal.status" />
  </RouterLink>
</template>

<style lang="scss" module>
@use '@/styles/vars';

.proposal {
  border-top: 2px solid vars.$gray6;
  border-bottom: 2px solid vars.$gray6;
  transition: 250ms ease background-color;
  & + & {
    margin-top: -2px;
  }
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  @media only screen and (min-width: vars.$md) {
    width: 100px;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}

.item-label {
  font-weight: 500;
  font-size: 12px;
  color: vars.$gray2;
  line-height: 100%;
}

.item-value {
  font-weight: 600;
  font-size: 16px;
  color: vars.$dark;
  @media only screen and (min-width: vars.$md) {
    margin-top: 2px;
    margin-bottom: 12px;
  }
}
</style>

<style lang="sass">
@use '@/styles/vars'

.module-governance-list-proposal
  display: flex
  flex-direction: column
  align-items: center
  gap: 0.75rem
  padding: 0 24px
  border-top: 2px solid vars.$gray6
  border-bottom: 2px solid vars.$gray6
  transition: 250ms ease background-color
  @media only screen and (min-width: vars.$md)
    flex-direction: row
  & + &
    margin-top: -2px
  &:hover
    background-color: vars.$gray7
  &__item
    position: relative
    width: 100px
    margin-right: 32px
    &-label
      position: absolute
      bottom: calc(100% + 4px)
      font-size: 12px
      color: vars.$gray2
      line-height: 14px
    &-value
      line-height: 20px
      font-weight: 500
  &__title
    flex: 1
    margin-right: 32px
    font-weight: 500
</style>
-->
