<script setup lang="ts" name="ModuleGovernanceProposalSideColumn">
import moment from 'moment'
import { shortenStringInTheMiddle } from '@/utils/common'
import { Proposal } from '../types'
import { getLowerCaseChoice, getLowerCaseChoices } from '../utils'
import { POSITIVE_CHOICES } from '../const'

const { t } = useI18n()
const vBem = useBemClass()

const props = defineProps<{
  proposal: Proposal
}>()
const { proposal } = toRefs(props)

function getChoicePercent(choice: string) {
  const choiceIndex = proposal.value.choices.indexOf(choice)
  const score = proposal.value.scores[choiceIndex]
  return score / proposal.value.scoresTotal * 100
}

const hasPositiveChoice = computed(() => {
  const positiveChoices = getLowerCaseChoices(POSITIVE_CHOICES)
  const proposalChoicesInLowerCase = getLowerCaseChoices(proposal.value.choices)
  return positiveChoices.some(positiveChoice => proposalChoicesInLowerCase.includes(positiveChoice))
})

function isChoicePositive(choice: string) {
  if (hasPositiveChoice.value) {
    const positiveChoices = getLowerCaseChoices(POSITIVE_CHOICES)
    return positiveChoices.includes(getLowerCaseChoice(choice))
  }
  return false
}

function isChoiceNegative(choice: string) {
  if (hasPositiveChoice.value) {
    const positiveChoices = getLowerCaseChoices(POSITIVE_CHOICES)
    return !positiveChoices.includes(getLowerCaseChoice(choice))
  }
  return false
}

function formatDate(timestamp: number) {
  return moment(timestamp * 1000).format('MMMM Do, YYYY, h:mm A')
}

const formattedStartDate = computed(() => {
  return formatDate(proposal.value.start)
})

const formattedEndDate = computed(() => {
  return formatDate(proposal.value.end)
})

const formattedId = computed(() => {
  return shortenStringInTheMiddle(proposal.value.id)
})

const proposalHref = computed(() => {
  return `https://snapshot.org/#/${import.meta.env.VITE_APP_SNAPSHOT_SPACE}/proposal/${proposal.value.id}`
})

const formattedCreator = computed(() => {
  return shortenStringInTheMiddle(proposal.value.author)
})

const creatorHref = computed(() => {
  return `https://snapshot.org/#/profile/${proposal.value.id}`
})

const snapshotHref = computed(() => {
  return `https://etherscan.io/block/${proposal.value.snapshot}`
})
</script>

<template>
  <div
    v-bem
  >
    <div v-bem="'section'">
      <div
        v-for="choice in proposal.choices"
        :key="choice"
        v-bem="['choice', { positive: isChoicePositive(choice), negative: isChoiceNegative(choice) }]"
      >
        <div v-bem="'choice-title'">
          {{ choice }}
        </div>
        <div v-bem="'choice-stats'">
          <span v-bem="'choice-amount'">
            45M
          </span>
          <span v-bem="'choice-percent'">
            {{ getChoicePercent(choice).toFixed(1) + '%' }}
          </span>
        </div>
        <div v-bem="'choice-line'">
          <div
            v-bem="'choice-line-fill'"
            :style="{ width: getChoicePercent(choice) + '%' }"
          />
        </div>
      </div>
    </div>
    <div v-bem="'section'">
      <div v-bem="'date'">
        <div v-bem="'date-label'">
          {{ t('ModuleGovernanceListProposal.startDate') }}
        </div>
        <div v-bem="'date-value'">
          {{ formattedStartDate }}
        </div>
      </div>
      <div v-bem="'date'">
        <div v-bem="'date-label'">
          {{ t('ModuleGovernanceListProposal.endDate') }}
        </div>
        <div v-bem="'date-value'">
          {{ formattedEndDate }}
        </div>
      </div>
    </div>
    <div v-bem="'section'">
      <a
        v-bem="'link'"
        target="_blank"
        :href="proposalHref"
      >
        Identifier <span>{{ formattedId }}</span>
        <IconKlayLink v-bem="'link-icon'" />
      </a>
      <a
        v-bem="'link'"
        target="_blank"
        :href="creatorHref"
      >
        Creator <span>{{ formattedCreator }}</span>
        <IconKlayLink v-bem="'link-icon'" />
      </a>
      <a
        v-bem="'link'"
        target="_blank"
        :href="snapshotHref"
      >
        Snapshot <span>{{ proposal.snapshot }}</span>
        <IconKlayLink v-bem="'link-icon'" />
      </a>
    </div>
  </div>
</template>

<style lang="sass">
@import '@/styles/vars.sass'

.module-governance-proposal-side-column
  display: flex
  flex-direction: column
  flex-shrink: 0
  width: 300px
  min-height: 100%
  padding: 24px
  border-left: 1px solid $gray5
  &__section
    padding-bottom: 24px
    &+&
      padding-top: 24px
      border-top: 1px solid $gray5
  &__choice
    display: flex
    justify-content: space-between
    flex-wrap: wrap
    font-size: 16px
    font-weight: 600
    line-height: 20px
    &+&
      margin-top: 27px
    &-line
      width: 100%
      height: 4px
      border-radius: 2px
      margin-top: 10px
      background-color: $gray5
      &-fill
        background-color: $blue
        height: 100%
        border-radius: 2px
    &--positive &-line-fill
      background-color: $green
    &--negative &-line-fill
      background-color: $red
  &__date
    position: relative
    width: 100%
    &+&
      margin-top: 24px
    &-label
      margin-bottom: 8px
      font-size: 12px
      color: $gray2
      line-height: 14px
    &-value
      font-size: 14px
      line-height: 17px
      font-weight: 500
  &__link
    display: block
    width: 100%
    font-size: 14px
    line-height: 20px
    font-weight: 500
    & + &
      margin-top: 24px
    span
      color: $blue
    &-icon
      display: inline-block
      margin-left: 5px
      color: $gray3
</style>