<script setup lang="ts" name="ModuleGovernanceProposalHead">
import { Proposal } from '../types'

const { t } = useI18n()
const { notify } = useNotify()
const vBem = useBemClass()

const props = defineProps<{
  proposal: Proposal
}>()
const { proposal } = toRefs(props)

const href = computed(() => {
  return window.location.href
})

const { copy, copied } = useClipboard()

function share() {
  copy(href.value)
}

watch(copied, (value) => {
  if (value) {
    notify({ type: 'ok', description: 'Link was successfully copied' })
  }
})
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
