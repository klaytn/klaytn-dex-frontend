<script setup lang="ts">
const assetsStore = useAssetsStore()
const totalUsd = toRef(assetsStore, 'totalUsd')

const tokensStore = useTokensStore()

function refresh() {
  tokensStore.touchDerivedUsd()
  tokensStore.touchUserBalance()
}

const isRefreshing = computed(
  () => tokensStore.isBalancePending || tokensStore.isImportedPending || tokensStore.isDerivedUSDPending,
)

assetsStore.useRefreshButton(reactive({ loading: isRefreshing, onClick: refresh }))
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="title-total flex pb-6 pt-4 px-4">
      <span class="flex-1">Total</span>
      <span>
        <CurrencyFormat
          :amount="totalUsd"
          usd
        />
      </span>
    </div>

    <hr class="klay-divider m-0">

    <ModuleAssetsAssetsList class="flex-1" />

    <hr class="klay-divider m-0">

    <div class="p-4">
      <KlayButton
        type="primary"
        size="lg"
        class="w-full"
        @click="assetsStore.openAssetsModal = true"
      >
        Add token
      </KlayButton>
    </div>
  </div>

  <ModuleAssetsAssetsModal />
</template>

<style lang="scss" scoped>
.title-total {
  font-size: 18px;
  font-weight: 700;
}
</style>
