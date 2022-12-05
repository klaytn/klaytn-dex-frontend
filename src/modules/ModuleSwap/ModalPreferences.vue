<script setup lang="ts">
import { SModal } from '@soramitsu-ui/ui'

const swapStore = useSwapStore()

const isOpen = ref(false)

function open() {
  isOpen.value = true
}

const showExpertModeConfirm = ref(false)

const expertMode = computed({
  get: () => swapStore.expertMode || showExpertModeConfirm.value,
  set(value) {
    if (value) showExpertModeConfirm.value = true
    else swapStore.expertMode = false
  },
})
</script>

<template>
  <SModal v-model:show="isOpen">
    <KlayModalCard class="w-420px lt-sm:mx-2">
      <template #title>
        Swap preferences
      </template>

      <div class="space-y-4">
        <KlaySwitch
          id="multi-hops"
          v-model="swapStore.multihops"
          label="Enable multi-hops"
        />

        <KlaySwitch
          id="expert-mode"
          v-model="expertMode"
          label="Expert mode"
        />
      </div>
    </KlayModalCard>
  </SModal>

  <ModuleSwapModalExpertModeConfirm
    :show="showExpertModeConfirm"
    @close="showExpertModeConfirm = false"
  />

  <slot v-bind="{ open }" />
</template>
