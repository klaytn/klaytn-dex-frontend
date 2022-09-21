<script setup lang="ts">
import { TransactionEnum } from '../query.transactions'
import { SModal } from '@soramitsu-ui/ui'

const props = defineProps<{
  item?: TransactionEnum | null
}>()

const emit = defineEmits(['close'])

const showModel = computed({
  get: () => !!props.item,
  set: (v) => !v && emit('close'),
})
</script>

<template>
  <SModal v-model:show="showModel">
    <KlayModalCard
      title="Transaction details"
      class="w-344px"
    >
      <div class="w-40 h-40 flex items-center justify-center bg-indigo-50 text-xl">
        WIP
      </div>
    </KlayModalCard>
  </SModal>
</template>
