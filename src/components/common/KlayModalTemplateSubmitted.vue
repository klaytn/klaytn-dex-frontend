<script setup lang="ts">
import { useModalApi } from '@soramitsu-ui/ui'
import MaterialSymbolsCheckCircleRounded from '~icons/material-symbols/check-circle-rounded'

const api = useModalApi()
</script>

<template>
  <div>
    <div class="p-16 flex flex-col items-center">
      <MaterialSymbolsCheckCircleRounded class="check text-7xl" />
      <h3 class="mt-6">
        Transaction Submitted
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

.check {
  color: vars.$green;
}
</style>
