<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<script setup lang="ts">
import { SModal } from '@soramitsu-ui/ui'
import { ModalOperation } from './types'
import ModalCard from './ModalCard.vue'

const props = defineProps<{
  operation: null | ModalOperation
}>()

const emit = defineEmits<(e: 'close') => void>()

const showModel = computed({
  get: () => !!props.operation,
  set: (v) => !v && emit('close'),
})
</script>

<template>
  <SModal v-model:show="showModel">
    <ModalCard
      v-bind="$attrs"
      :operation="operation!"
    />
  </SModal>
</template>
