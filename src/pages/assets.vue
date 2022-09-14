<script setup lang="ts">
import { formatAddress } from '@/core'
import { storeToRefs } from 'pinia'
import invariant from 'tiny-invariant'
import { KlayIconCopy, KlayIconRefresh, KlayIconArrowDown_2 } from '~klay-icons'
import { RouteName, Tab } from '@/types'

const AssetsTabs = {
  Assets: 'assets',
  Transactions: 'transactions',
} as const

type AssetsTabs = typeof AssetsTabs[keyof typeof AssetsTabs]

const { notify } = useNotify()

const store = useDexStore()
const { account } = storeToRefs(store)

const tabs = computed<Tab[]>(() => {
  return [
    {
      id: AssetsTabs.Assets,
      label: 'Assets',
    },
    {
      id: AssetsTabs.Transactions,
      label: 'Transactions',
    },
  ]
})

const router = useRouter()
const route = useRoute()

const tab = computed<AssetsTabs>({
  get: () => {
    const name = route.name
    if (name === RouteName.AssetsThemselves) return AssetsTabs.Assets
    if (name === RouteName.Transactions) return AssetsTabs.Transactions
    throw new Error(`Unexpected route name: ${String(name)}`)
  },
  set: (v) => {
    router.replace({
      name: v === AssetsTabs.Assets ? RouteName.AssetsThemselves : RouteName.Transactions,
    })
  },
})

const isQRCodeModalOpen = ref(false)

const { copy } = useClipboard()

async function copyAddress() {
  invariant(account.value)
  await copy(account.value)
  notify({ type: 'ok', title: 'Your address was successfully copied' })
}

function refresh() {}

const addressFormatted = computed(() => account.value && formatAddress(account.value, 7))
</script>

<template>
  <div class="wrap mx-auto space-y-4 flex flex-col">
    <div
      v-if="!account"
      class="p-4 text-center"
    >
      Connect Wallet
    </div>

    <template v-else>
      <div class="flex items-center space-x-4 px-4 pt-4">
        <h1 class="flex-1">
          Assets
        </h1>

        <span class="flex space-x-3">
          <span>
            {{ addressFormatted }}
          </span>
          <KlayIconCopy
            class="cursor-pointer"
            @click="copyAddress"
          />
        </span>

        <div class="flex-1 flex justify-end">
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
      </div>

      <div class="flex items-center space-x-4 px-4">
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

      <div class="flex-1 min-h-0">
        <RouterView />
      </div>
    </template>
  </div>

  <ModuleAssetsModalQRCode v-model:show="isQRCodeModalOpen" />
</template>

<style lang="scss" scoped>
// @use '@/styles/vars';

.wrap {
  background: linear-gradient(0deg, #ffffff, #ffffff),
    linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 100%), rgba(255, 255, 255, 0.6);
  box-shadow: 0px 20px 40px rgba(0, 0, 0, 0.05);
  border-radius: 20px;
  width: 420px;
  height: 600px;
}
</style>

<route lang="yaml">
name: Assets
</route>
