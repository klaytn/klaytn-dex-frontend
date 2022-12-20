<script setup lang="ts">
import { Proposal } from '../types'
import { formatAmount, getLowerCaseChoice, getLowerCaseChoices } from '../utils'
import { POSITIVE_CHOICES } from '../const'

const props = defineProps<{
  proposal: Proposal
}>()
const { proposal } = toRefs(props)

function getChoiceScore(choice: string) {
  const choiceIndex = proposal.value.choices.indexOf(choice)
  return proposal.value.scores[choiceIndex] ?? 0
}

function getChoicePercent(choice: string) {
  if (!proposal.value.scoresTotal) return 0
  const choiceIndex = proposal.value.choices.indexOf(choice)
  const score = proposal.value.scores[choiceIndex]
  return (score / proposal.value.scoresTotal) * 100
}

function formatPercent(percent: number) {
  return Number(percent.toFixed(1)) + '%'
}

const hasPositiveChoice = computed(() => {
  const positiveChoices = getLowerCaseChoices(POSITIVE_CHOICES)
  const proposalChoicesInLowerCase = getLowerCaseChoices(proposal.value.choices)
  return positiveChoices.some((positiveChoice) => proposalChoicesInLowerCase.includes(positiveChoice))
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
</script>

<template>
  <div class="flex flex-col gap-7">
    <div
      v-for="choice in proposal.choices"
      :key="choice"
      class="flex justify-between flex-wrap font-semibold"
    >
      <div>
        {{ choice }}
      </div>
      <span> {{ formatAmount(getChoiceScore(choice)) }} {{ formatPercent(getChoicePercent(choice)) }} </span>
      <div
        :class="$style.lineWrapper"
        class="w-full h-1 border-rd mt-2.5"
      >
        <div
          class="h-full border-rd"
          :class="{
            [$style.blueLine]: !isChoicePositive(choice) && !isChoiceNegative(choice),
            [$style.greenLine]: isChoicePositive(choice),
            [$style.redLine]: isChoiceNegative(choice),
          }"
          :style="{ width: getChoicePercent(choice) + '%' }"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
@use '@/styles/vars';

.line-wrapper {
  background-color: vars.$gray5;
}

.blue-line {
  background-color: vars.$blue;
}

.green-line {
  background-color: vars.$green;
}

.red-line {
  background-color: vars.$red;
}
</style>
