<script setup lang="ts">
import { SModal } from '@soramitsu-ui/ui'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close'])

const swapStore = useSwapStore()

const showModel = computed({
  get: () => props.show,
  set: (value) => {
    if (!value) {
      emit('close')
      swapStore.expertMode = false
      showConfirm.value = false
    }
  },
})

const showConfirm = ref(false)
const confirmText = ref('')

function turnOnExpertMode() {
  showConfirm.value = true
}

const confirmDisabled = computedEager(() => {
  return confirmText.value.toLowerCase() !== 'confirm'
})

function confirm() {
  emit('close')
  swapStore.expertMode = true
  showConfirm.value = false
}
</script>

<template>
  <SModal v-model:show="showModel">
    <KlayModalCard
      title="Are you sure?"
      class="w-420px lt-sm:mx-2"
    >
      <template v-if="showConfirm">
        <KlayTextField
          v-model="confirmText"
          label="Enter 'confirm'"
        />
        <KlayButton
          class="w-full mt-4"
          type="primary"
          size="lg"
          :disabled="confirmDisabled"
          @click="confirm"
        >
          Confirm
        </KlayButton>
      </template>
      <template v-else>
        <span class="lh-4">
          Expert mode turns off the confirm transaction prompt and allows high slippage trades that often result in bad
          rates and lost funds.
          <br>
          <br>
          <b>ONLY USE THIS MODE IF YOU KNOW WHAT YOU ARE DOING.</b>
        </span>
        <KlayButton
          class="w-full mt-4"
          type="primary"
          size="lg"
          @click="turnOnExpertMode"
        >
          Turn On Expert Mode
        </KlayButton>
      </template>
    </KlayModalCard>
  </SModal>
</template>
