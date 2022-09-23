<script setup lang="ts">
import { SModal } from '@soramitsu-ui/ui'

const swapStore = useSwapStore()

const isOpen = ref(false)

function open() {
  isOpen.value = true
}
</script>

<template>
  <SModal v-model:show="isOpen">
    <KlayModalCard class="w-420px">
      <template #title>
        Swap preferences
      </template>

      <div>
        <KlaySwitch
          v-model="swapStore.disableMultiHops"
          label="Disable multi-hops"
        />
      </div>
    </KlayModalCard>
  </SModal>

  <slot v-bind="{ open }" />
</template>
