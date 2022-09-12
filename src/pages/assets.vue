<script setup lang="ts">
import { formatAddress } from '@/core'
import { storeToRefs } from 'pinia'
import invariant from 'tiny-invariant'
import { KlayIconCopy, KlayIconRefresh, KlayIconArrowDown_2 } from '~klay-icons'
import { makeTabsArray } from '@/utils/common'

const AssetsTabs = {
  assets: 'assets',
  transactions: 'transactions',
} as const

type AssetsTabs = typeof AssetsTabs[keyof typeof AssetsTabs]

const { notify } = useNotify()

const store = useDexStore()
const { account } = storeToRefs(store)

const tabs = readonly(makeTabsArray(Object.values(AssetsTabs)))

const tab = ref(AssetsTabs.assets)
const isQRCodeModalOpen = ref(false)

const { copy, copied } = useClipboard()

function copyAddress() {
  invariant(account.value, 'there is no account')
  copy(account.value)
}

watch(copied, (value) => {
  if (value) {
    notify({ type: 'ok', description: 'Your address was successfully copied' })
  }
})

function refresh() {

}

const addressFormatted = computed(() => account.value && formatAddress(account.value, 7))

</script>

<template>
  <div class="wrap mx-auto pb-5">
    <div
      v-if="!account"
      class="p-4 text-center no-results"
    >
      Connect Wallet
    </div>
    <template v-else>
      <div class="flex items-center mb-4 space-x-4 pt-5 pr-4 pl-5">
        <h1>
          Assets
        </h1>

        <div class="flex-1" />

        <span class="flex">
          {{ addressFormatted }}
          <KlayIconCopy
            class="ml-3"
            @click="copyAddress"
          />
        </span>

        <div class="flex-1" />

        <KlayButton
          type="action"
          rounded
          @click="refresh"
        >
          <template #icon>
            <KlayIconRefresh />
          </template>
        </KlayButton>
      </div>

      <div class="flex items-center mb-4 space-x-4 pt-5 px-4">
        <KlayTabs
          v-model="tab"
          :tabs="tabs"
        />

        <div class="flex-1" />

        <KlayButton
          type="action"
          rounded
          @click="isQRCodeModalOpen = true"
        >
          <template #icon>
            <KlayIconArrowDown_2 />
          </template>
        </KlayButton>
      </div>
      
      <RouterView />
    </template>
  </div>

  <ModuleAssetsModalQRCode
    v-model="isQRCodeModalOpen"
  />
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

.wrap {
  background: linear-gradient(0deg, #ffffff, #ffffff),
    linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 100%), rgba(255, 255, 255, 0.6);
  box-shadow: 0px 20px 40px rgba(0, 0, 0, 0.05);
  border-radius: 20px;
  max-width: 420px;
  width: 100%;
}
</style>

<route lang="yaml">
name: Assets
</route>
