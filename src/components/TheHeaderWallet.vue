<script setup lang="ts">
import { formatAddress } from '@/core'
import { SPopover } from '@soramitsu-ui/ui'
import { storeToRefs } from 'pinia'
import WalletConnectButton from './WalletConnectButton.vue'
import WalletIcon from './WalletIcon.vue'

const store = useDexStore()
const { account, selectedWallet, isChainCorrect, isChainLoaded, isProviderSetupPending, isEnabled } = storeToRefs(store)

const wrongChain = logicAnd(isChainLoaded, logicNot(isChainCorrect))

const addressFormatted = computed(() => account.value && formatAddress(account.value))
</script>

<template>
  <WalletConnectButton v-if="!selectedWallet" />

  <SPopover
    v-else
    placement="bottom-end"
    distance="8"
    hide-delay="400"
  >
    <template #trigger>
      <div
        class="wallet h-full rounded-lg p-2 flex items-center space-x-2 cursor-pointer"
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
          v-else-if="!isEnabled"
          class="not-enabled"
        > Not enabled </span>

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
        class="popper bg-white rounded-lg shadow-md p-4 z-10 space-y-4 flex flex-col"
      >
        <h3>
          {{ selectedWallet === 'kaikas' ? 'Kaikas' : 'MetaMask' }}
        </h3>

        <div
          v-if="account"
          class="connected-account flex items-center space-x-4"
        >
          <div>Account:</div>
          <AddressCopy
            class="flex-1 overflow-hidden"
            :address="account"
          />
        </div>

        <div class="space-x-4">
          <KlayButton
            v-if="!isEnabled"
            type="primary"
            size="sm"
            data-testid="wallet-enable"
            @click="store.enable()"
          >
            Enable
          </KlayButton>

          <KlayButton
            type="primary"
            size="sm"
            data-testid="wallet-disconnect"
            @click="store.selectWallet(null)"
          >
            Disconnect
          </KlayButton>
        </div>
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

.not-enabled,
.wrong-chain {
  font-weight: 600;
  font-size: 14px;
}

.address {
  font-size: 12px;
  font-weight: 700;
}

.connected-account {
  font-weight: 500;
  font-size: 12px;
}

.popper {
  box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.15);
  width: 240px;
  z-index: 1000;
}
</style>
