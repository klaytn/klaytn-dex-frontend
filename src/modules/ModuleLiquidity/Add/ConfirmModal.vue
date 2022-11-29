<script lang="ts" setup>
import { RouteName } from '@/types'
import { SModal } from '@soramitsu-ui/ui'
import { storeToRefs } from 'pinia'

const router = useRouter()

const store = useLiquidityAddStore()
const { supplyScope } = storeToRefs(store)

function supply() {
  supplyScope.value?.supply()
}

const show = computed({
  get: () => supplyScope.value?.prepareState.fulfilled ?? false,
  set: (flag) => {
    if (!flag) {
      store.closeSupply()

      if (supplyScope.value?.supplyState.fulfilled) {
        store.refresh()
        router.push({ name: RouteName.Liquidity })
      }
    }
  },
})
</script>

<template>
  <SModal v-model:show="show">
    <KlayModalCard class="w-344px">
      <template #title>
        Confirm Supply
      </template>

      <KlayModalTemplateSubmitted v-if="supplyScope?.supplyState.fulfilled" />
      <KlayModalTemplateError v-else-if="supplyScope?.supplyState.rejected" />
      <div
        v-else
        class="space-y-4"
      >
        <ModuleLiquidityAddDetails in-modal />

        <KlayButton
          type="primary"
          size="lg"
          class="w-full"
          :loading="supplyScope?.supplyState.pending"
          data-testid="add-liquidity-modal-confirm"
          @click="supply()"
        >
          Confirm Supply
        </KlayButton>
      </div>
    </KlayModalCard>
  </SModal>
</template>
