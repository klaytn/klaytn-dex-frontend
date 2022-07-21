<script setup lang="ts" name="KlayModalCard">
import { useModalApi } from '@soramitsu-ui/ui'

defineProps<{
  title?: string
}>()

const api = useModalApi()
</script>

<template>
  <div class="card space-y-5">
    <div class="head pt-5 px-4">
      <h3>
        <slot name="title">
          {{ title }}
        </slot>
      </h3>

      <button
        class="close"
        type="button"
        @click="api.close()"
      >
        <IconKlayClose />
      </button>
    </div>

    <slot name="body">
      <div class="px-4 pb-5">
        <slot />
      </div>
    </slot>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/vars';

.card {
  background: $white;
  border-radius: 20px;
  max-height: 90vh;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
