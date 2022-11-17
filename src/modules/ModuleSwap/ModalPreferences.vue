<script setup lang="ts">
import { SModal } from '@soramitsu-ui/ui'

const swapStore = useSwapStore()

const isOpen = ref(false)

function open() {
  isOpen.value = true
}

const showExpertModeConfirm = ref(false)

const expertMode = computed({
  get() {
    return swapStore.expertMode
  },
  set(value) {
    if (value) showExpertModeConfirm.value = true
    else swapStore.expertMode = false
  },
})
</script>

<template>
  <SModal v-model:show="isOpen">
    <KlayModalCard class="w-420px">
      <template #title>
        Swap preferences
      </template>

      <div class="space-y-4">
        <KlaySwitch
          v-model="swapStore.multihops"
          label="Enable multi-hops"
        />

        <KlaySwitch
          v-model="expertMode"
          label="Expert mode"
        />
      </div>
    </KlayModalCard>
  </SModal>

  <ModuleSwapModalExpertModeConfirm v-model:show="showExpertModeConfirm" />

  <slot v-bind="{ open }" />
</template>
