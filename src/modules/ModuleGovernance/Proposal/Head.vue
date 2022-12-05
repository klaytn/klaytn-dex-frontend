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
  <div
    :class="$style.head"
    class="flex items-center justify-start flex-wrap gap-4 px-6 py-4 md:py-5"
  >
    <span
      v-bem="'title'"
      class="lt-md:w-full mr-auto text-xl font-semibold"
    >
      {{ proposal.title }}
    </span>
    <KlayButton
      size="sm"
      @click="share"
    >
      {{ t('ModuleGovernanceProposalHead.share') }}
    </KlayButton>
    <ModuleGovernanceProposalStatus :status="proposal.status" />
  </div>
</template>

<style lang="scss" module>
@use '@/styles/vars';

.head {
  border-bottom: 1px solid vars.$gray5;
}
</style>
