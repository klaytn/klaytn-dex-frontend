<script setup lang="ts">
import dayjs from 'dayjs'
import { Proposal } from '../types'

const { t } = useI18n()

const props = defineProps<{
  proposal: Proposal
}>()
const { proposal } = toRefs(props)

function formatDate(timestamp: number) {
  return dayjs(timestamp * 1000).format('MMMM D, YYYY, h:mm A')
}

const formattedStartDate = computed(() => {
  return formatDate(proposal.value.start)
})

const formattedEndDate = computed(() => {
  return formatDate(proposal.value.end)
})
</script>

<template>
  <div>
    <div
      v-for="{ label, value } in [
        { label: t('ModuleGovernanceListProposal.startDate'), value: formattedStartDate },
        { label: t('ModuleGovernanceListProposal.endDate'), value: formattedEndDate },
      ]"
      :key="label"
      :class="$style.date"
    >
      <div
        :class="$style.dateLabel"
        class="text-xs mb-2"
      >
        {{ label }}
      </div>
      <div class="text-sm font-medium">
        {{ value }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
@use '@/styles/vars';

.date {
  & + & {
    margin-top: 1.5rem;
  }
  &-label {
    color: vars.$gray2;
  }
}
</style>
