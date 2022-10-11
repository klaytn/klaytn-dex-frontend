<script setup lang="ts">
import { formatAddress } from '@/core'
import { SPopover } from '@soramitsu-ui/ui'
import { not, and } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import WalletConnectButton from './WalletConnectButton.vue'
import WalletIcon from './WalletIcon.vue'

const store = useDexStore()
const { account, selectedWallet, isChainCorrect, isChainLoaded, isProviderSetupPending } = storeToRefs(store)

const wrongChain = and(isChainLoaded, not(isChainCorrect))

const addressFormatted = computed(() => account.value && formatAddress(account.value))
</script>

<template>
  <WalletConnectButton v-if="!selectedWallet" />

  <SPopover
    v-else
    placement="bottom"
    distance="8"
    hide-delay="400"
  >
    <template #trigger>
      <div
        class="wallet rounded-lg p-2 flex items-center space-x-2 cursor-pointer"
        :class="{ 'wallet--warning': wrongChain }"
      >
        <WalletIcon
          :wallet="selectedWallet"
          class="text-xl"
        />

        <KlayLoader
          v-if="isProviderSetupPending"
          size="20"
        />

        <span
          v-if="wrongChain"
          class="wrong-chain"
        > Wrong chain </span>

        <span
          v-if="addressFormatted"
          class="address"
        >
          {{ addressFormatted }}
        </span>
      </div>
    </template>

    <template #popper="{ show }">
      <div
        v-if="show"
        class="popper bg-white rounded-lg shadow-md p-4 z-10"
      >
        <KlayButton
          type="primary"
          @click="store.selectWallet(null)"
        >
          Log out
        </KlayButton>
      </div>
    </template>
  </SPopover>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.wallet {
  background: white;

  &--warning {
    outline: transparentize(vars.$orange, 0.5) solid 5px;
  }
}

.wrong-chain {
  color: vars.$orange;
  font-weight: 600;
  font-size: 14px;
}

.address {
  font-size: 12px;
  font-weight: 700;
}

.popper {
  box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.15);
}
</style>
