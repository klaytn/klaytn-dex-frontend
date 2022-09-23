<script setup lang="ts">
import { SModal } from '@soramitsu-ui/ui'
import { ModalOperationComposite } from './types'
import BigNumber from 'bignumber.js'
import { WeiAsToken } from '@/core'
import ModalCard from './StakeUnstakeModalCard.vue'

const props = defineProps<{
  operation: null | ModalOperationComposite
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'staked' | 'unstaked', amount: WeiAsToken<BigNumber>): void
}>()

const showModel = computed({
  get: () => !!props.operation,
  set: (v) => !v && emit('close'),
})
</script>

<template>
  <SModal v-model:show="showModel">
    <ModalCard
      :operation="operation!"
      @staked="emit('staked', $event)"
      @unstaked="emit('unstaked', $event)"
    />
  </SModal>
</template>
