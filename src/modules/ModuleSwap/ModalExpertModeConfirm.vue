<script setup lang="ts">
import { SModal } from '@soramitsu-ui/ui'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close'])

const showModel = computed({
  get: () => props.show,
  set: (v) => !v && emit('close'),
})

const swapStore = useSwapStore()

function enableExpertMode () {
  swapStore.expertMode = true
}
</script>

<template>
  <SModal v-model:show="showModel">
    <KlayModalCard
      title="Are you sure?"
      class="w-[420px]"
    >
      <span class="lh-4">
        Expert mode turns off the confirm transaction prompt and allows high slippage trades that often result in bad rates and lost funds.
        <br>
        <br>
        ONLY USE THIS MODE IF YOU KNOW WHAT YOU ARE DOING.
      </span>

      <KlayButton
        class="w-full mt-4"
        type="primary"
        size="lg"
        @click="enableExpertMode"
      >
        Confirm Swap
      </KlayButton>
    </KlayModalCard>
  </SModal>
</template>
