<script setup lang="ts" name="ModuleGovernanceProposalDescription">
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { Proposal } from '../types'

const { t } = useI18n()
const vBem = useBemClass()

const props = defineProps<{
  proposal: Proposal
}>()
const { proposal } = toRefs(props)

const expanded = ref(true)

const parcedBody = computed(() => {
  console.log(proposal.value)
  return marked(proposal.value.body)
})

let cleanBody = computed(() => {
  return DOMPurify.sanitize(parcedBody.value)
})
</script>

<template>
  <KlayAccordionItem
    v-model="expanded"
    v-bem
    type="light"
  >
    <template #title>
      <span v-bem="'title'">
        {{ t('ModuleGovernanceProposalDescription.title') }}
      </span>
    </template>
    <div
      class="markdown-body"
      v-html="cleanBody"
    />
  </KlayAccordionItem>
</template>

<style lang="sass">
@import '@/styles/vars.sass'

$padding-bottom: 19px

.module-governance-proposal-description
  &__title
    font-size: 20px
    font-weight: 600
</style>