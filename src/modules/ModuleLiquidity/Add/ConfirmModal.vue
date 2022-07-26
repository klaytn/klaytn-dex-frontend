<script lang="ts" setup>
import { SModal } from '@soramitsu-ui/ui'
import { storeToRefs } from 'pinia'

const liquidityStore = useLiquidityAddStore()
const { supplyScope } = storeToRefs(liquidityStore)

const isOk = computed(() => supplyScope.value?.supplyState.fulfilled ?? false)
const isPending = computed(() => supplyScope.value?.supplyState.pending ?? false)

function supply() {
  supplyScope.value?.supply()
}

const show = computed({
  get: () => supplyScope.value?.prepareState.fulfilled ?? false,
  set: (flag) => {
    if (!flag) {
      liquidityStore.clearSupply()
    }
  },
})
</script>

<template>
  <SModal v-model:show="show">
    <KlayModalCard class="w-[344px]">
      <template #title>
        Confirm Supply <i>[wip]</i>
      </template>

      <div v-if="isOk">
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
          :loading="isPending"
          @click="supply()"
        >
          Confirm Supply
        </KlayButton>
      </div>
    </KlayModalCard>
  </SModal>
</template>
