<script setup lang="ts">
import { SModal } from '@soramitsu-ui/ui'

const props = defineProps<{
  open: boolean
}>()
const emit = defineEmits(['update:open'])

const openModel = useVModel(props, 'open', emit)
</script>

<template>
  <SModal v-model:show="openModel">
    <KlayModalCard title="Remove LP Tokens" />
  </SModal>
</template>
