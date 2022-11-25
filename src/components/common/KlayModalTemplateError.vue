<script setup lang="ts">
import { useModalApi } from '@soramitsu-ui/ui'
import MaterialSymbolsErrorRounded from '~icons/material-symbols/error-rounded'

const api = useModalApi()
</script>

<template>
  <div>
    <div class="p-16 flex flex-col items-center">
      <MaterialSymbolsErrorRounded class="error text-7xl" />
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
@use '@/styles/vars';

.error {
  color: vars.$red;
}
</style>
