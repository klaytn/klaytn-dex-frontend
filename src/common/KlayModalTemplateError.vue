<script setup lang="ts">
import { useModalApi } from '@soramitsu-ui/ui'

const api = useModalApi()
</script>

<template>
  <div>
    <div class="p-16 flex flex-col items-center">
      <IconMaterialSymbolsErrorRounded class="error text-7xl" />
      <h3 class="mt-6">
        Error
      </h3>
    </div>

    <KlayButton
      class="w-full"
      type="primary"
      size="lg"
      @click="api.close()"
    >
      Close
    </KlayButton>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

.error {
  color: $red;
}
</style>
