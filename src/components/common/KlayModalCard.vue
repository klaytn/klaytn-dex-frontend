<script setup lang="ts" name="KlayModalCard">
import { useModalApi } from '@soramitsu-ui/ui'
import MaterialSymbolsArrowBack from '~icons/material-symbols/arrow-back'
import MaterialSymbolsClose from '~icons/material-symbols/close'

defineProps<{
  title?: string
  backArrow?: boolean
}>()

const emit = defineEmits(['click:back'])

const api = useModalApi()
</script>

<template>
  <div class="card flex flex-col space-y-5 mx-2 max-w-[calc(100vw_-_1rem)]">
    <div class="head pt-5 px-4 space-x-4">
      <button
        v-if="backArrow"
        @click="emit('click:back')"
      >
        <MaterialSymbolsArrowBack />
      </button>

      <h3 class="flex-1">
        <slot name="title">
          {{ title }}
        </slot>
      </h3>

      <button
        class="close"
        type="button"
        data-testid="klay-modal-card-close-button"
        @click="api.close()"
      >
        <MaterialSymbolsClose />
      </button>
    </div>

    <slot name="body">
      <div class="flex-1 px-4 pb-5">
        <slot />
      </div>
    </slot>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/vars';

.card {
  background: vars.$white;
  border-radius: 20px;
  max-height: 90vh;
}

.head {
  display: flex;
  align-items: center;
  height: 65px;

  h3 {
    font-style: normal;
    font-weight: 700;
    font-size: 18px;
    line-height: 150%;
  }
}

.close {
  cursor: pointer;
}
</style>
