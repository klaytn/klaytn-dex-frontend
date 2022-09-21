<script setup lang="ts">
import { parseAddress } from '@/core'
import { useMinimalTokensApi } from '@/utils/minimal-tokens-api'
import { KlayIconArrowDown_2, KlayIconSwap, KlayIconBackArrow } from '~klay-icons'
import { RouteName } from '@/types'
import AssetTransactionsList from '@/modules/ModuleAssets/AssetTransactionsList.vue'

const assetsStore = useAssetsStore()

const route = useRoute()
const id = computed(() => parseAddress(route.params.id as any))

const { lookupToken, lookupBalance, lookupDerivedUsd } = useMinimalTokensApi()

const token = computed(() => lookupToken(id.value))

const balance = computed(() => lookupBalance(id.value))

const balanceAsToken = computed(() => {
  return balance.value && token.value && balance.value.decimals(token.value)
})

const derivedUsd = computed(() => lookupDerivedUsd(id.value))

const balanceAsUsd = computed(() => {
  return derivedUsd.value && balanceAsToken.value && balanceAsToken.value.times(derivedUsd.value)
})

function openReceiveModal() {
  assetsStore.openReceiveModal = true
}
</script>

<template>
  <div class="flex-1 flex flex-col">
    <div class="p-4 space-y-4">
      <div class="flex items-center space-x-2">
        <div class="flex-1">
          <button>
            <RouterLink :to="{ name: RouteName.Assets }">
              <KlayIconBackArrow />
            </RouterLink>
          </button>
        </div>

        <div :class="$style.header">
          <ValueOrDash :value="token?.name" />
        </div>

        <div class="flex-1" />
      </div>

      <div class="flex items-end space-x-2">
        <KlayCharAvatar
          :symbol="token?.symbol"
          size="36"
        />

        <div class="flex-1 space-y-1">
          <div :class="$style.title2">
            <ValueOrDash :value="token?.symbol" />
          </div>
          <div :class="$style.subtitle">
            <CurrencyFormat
              :amount="derivedUsd"
              usd
              decimals="2"
            />
          </div>
        </div>

        <div class="flex flex-col">
          <CurrencyFormatTruncate
            :class="$style.title1"
            :amount="balanceAsToken"
            :symbol="token?.symbol"
            max-width="180"
          />
          <div class="mt-1 flex justify-end">
            <CurrencyFormatTruncate
              :class="$style.subtitle"
              :amount="balanceAsUsd"
              usd
              decimals="2"
            />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <KlayButton @click="openReceiveModal">
          <template #icon>
            <KlayIconArrowDown_2 />
          </template>
          Receive
        </KlayButton>
        <KlayButton>
          <template #icon>
            <KlayIconSwap />
          </template>
          Swap
        </KlayButton>
      </div>
    </div>

    <hr class="klay-divider w-full">

    <AssetTransactionsList
      :id="id"
      class="flex-1"
    />
  </div>
</template>

<style lang="scss" module>
@use '@/styles/vars';

.header {
  font-weight: 700;
  font-size: 18px;
}

.title2 {
  font-weight: 600;
  font-size: 16px;
}

.title1 {
  font-weight: 600;
  font-size: 30px;
}

.subtitle {
  font-weight: 500;
  font-size: 14px;
  color: vars.$gray2;
}
</style>
