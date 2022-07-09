<script setup lang="ts" name="KlayModal">
import { useModalApi } from '@soramitsu-ui/ui'

defineProps<{
  title?: string
}>()

const api = useModalApi()
</script>

<template>
  <div class="card">
    <div class="head">
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
        <KlayIcon name="close" />
      </button>
    </div>

    <slot />
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/vars';

.card {
  text-align: left;
  background: $white;
  border-radius: 20px;
  z-index: 999;
  max-height: 90vh;
  overflow: auto;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 20px 17px;
  padding-bottom: 0;
  & h3 {
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
