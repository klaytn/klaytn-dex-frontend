<script setup lang="ts" name="ModuleGovernanceProposalSideColumn">
import { KlayIconLink } from '~klay-icons'
import { shortenStringInTheMiddle } from '@/utils/common'
import { Proposal } from '../types'
import CONFIG from '~config'

const vBem = useBemClass()

const props = defineProps<{
  proposal: Proposal
}>()
const { proposal } = toRefs(props)

const formattedId = computed(() => {
  return shortenStringInTheMiddle(proposal.value.id)
})

const proposalHref = computed(() => {
  return `https://snapshot.org/#/${CONFIG.snapshotSpace}/proposal/${proposal.value.id}`
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
  <div>
    <a
      v-bem="'link'"
      target="_blank"
      :href="proposalHref"
    >
      Identifier <span>{{ formattedId }}</span>
      <KlayIconLink v-bem="'link-icon'" />
    </a>
    <a
      v-bem="'link'"
      target="_blank"
      :href="creatorHref"
    >
      Creator <span>{{ formattedCreator }}</span>
      <KlayIconLink v-bem="'link-icon'" />
    </a>
    <a
      v-bem="'link'"
      target="_blank"
      :href="snapshotHref"
    >
      Snapshot <span>{{ proposal.snapshot }}</span>
      <KlayIconLink v-bem="'link-icon'" />
    </a>
  </div>
</template>

<style lang="sass">
@use '@/styles/vars'

.module-governance-proposal-side-column
  &__link
    display: block
    width: 100%
    font-size: 14px
    line-height: 20px
    font-weight: 500
    & + &
      margin-top: 24px
    span
      color: vars.$blue
    &-icon
      display: inline-block
      margin-left: 5px
      color: vars.$gray3
</style>
