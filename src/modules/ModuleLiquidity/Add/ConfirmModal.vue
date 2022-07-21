<script lang="ts" setup>
import { SModal } from '@soramitsu-ui/ui'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  modelValue: boolean
}>()
const emit = defineEmits(['update:modelValue'])

const show = useVModel(props, 'modelValue', emit)

const liquidityStore = useLiquidityAddStore()
const { isAddLiquidityPending: isInProgress, isSubmitted } = storeToRefs(liquidityStore)

function supply() {
  liquidityStore.addLiquidity()
}
</script>

<template>
  <SModal
    v-model:show="show"
    @after-close="liquidityStore.clearSubmittion()"
  >
    <KlayModalCard class="w-[344px]">
      <template #title>
        Confirm Supply <i>[wip]</i>
      </template>

      <div v-if="isSubmitted">
        <div class="text-xl text-center font-bold p-6 mb-16">
          Transaction Submitted
        </div>

        <KlayButton
          type="primary"
          size="lg"
          class="w-full"
          @click="show = false"
        >
          Close
        </KlayButton>
      </div>

      <div
        v-else
        class="space-y-4"
      >
        <ModuleLiquidityAddDetails in-modal />

        <KlayButton
          type="button"
          size="lg"
          class="w-full"
          :loading="isInProgress"
          @click="supply()"
        >
          Confirm Supply
        </KlayButton>
      </div>
    </KlayModalCard>
  </SModal>
</template>
