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

const body = ref<Element | null>(null)
const bodyHeight = ref(0)
const expanded = ref(false)

const resizeObserver = new ResizeObserver(() => {
  if (body.value === null) return
  bodyHeight.value = body.value.clientHeight
})

onMounted(() => {
  if (body.value === null) return
  bodyHeight.value = body.value.clientHeight
  resizeObserver.observe(body.value)
  if (!long.value) expanded.value = true
})

const long = computed(() => {
  return bodyHeight.value >= 350
})

const parcedBody = computed(() => {
  return marked(proposal.value.body)
})

let cleanBody = computed(() => {
  return DOMPurify.sanitize(parcedBody.value)
})
</script>

<template>
  <KlayAccordionItem
    v-model="expanded"
    v-bem="{ long }"
    type="light"
  >
    <template #title>
      <span v-bem="'title'">
        {{ t('ModuleGovernanceProposalDescription.title') }}
      </span>
    </template>
    <div
      ref="body"
      class="markdown-body"
      v-html="cleanBody"
    />
    <div
      v-if="!expanded && long"
      v-bem="'gradient'"
    >
      <KlayButton
        v-bem="'view-more'"
        type="primary"
        size="sm"
        @click="expanded = !expanded"
      >
        {{ t('ModuleGovernanceProposalDescription.viewMore') }}
      </KlayButton>
    </div>
  </KlayAccordionItem>
</template>

<style lang="sass">
@import '@/styles/vars.sass'

$padding-bottom: 19px

.module-governance-proposal-description
  .s-accordion-item__body-wrapper
    display: block !important
  &--long .s-accordion-item__body-wrapper
    display: block !important
    min-height: 350px
    overflow: hidden
  &--long:not(.s-accordion-item_expanded) .s-accordion-item__body-wrapper
    height: 350px
  &:not(&--long) .s-accordion-item__trigger
    pointer-events: none
  &__title
    font-size: 20px
    font-weight: 600
  &__gradient
    position: absolute
    display: flex
    flex-direction: column
    justify-content: flex-end
    align-items: center
    width: 100%
    height: 88px
    bottom: 0
    background: linear-gradient(180deg, rgba($white, 0) 0, $white 56px, $white 100%)
  &__view-more
    padding: 0 16px !important
</style>