<script setup lang="ts">
import { isKaikasDetected } from '@/core'
import { SModal } from '@soramitsu-ui/ui'
import { storeToRefs } from 'pinia'
import WalletIcon from './WalletIcon.vue'

import CONFIG from '~config'

const store = useDexStore()
const { isMetamaskDetected, selectedWallet, connectState, isProviderSetupPending, openModal } = storeToRefs(store)

interface Wallet {
  wallet: 'metamask' | 'kaikas'
  label: string
  disabled: boolean
}

const wallets = computed<Wallet[]>(() => {
  return [
    {
      wallet: 'metamask',
      label: 'MetaMask',
      disabled: !isMetamaskDetected.value,
    },
    {
      wallet: 'kaikas',
      label: 'Kaikas',
      disabled: !isKaikasDetected,
    },
  ]
})
</script>

<template>
  <SModal v-model:show="openModal">
    <KlayModalCard
      title="Connect Wallet"
      class="w-344px"
    >
      <template #body>
        <div>
          <div class="p-8 flex items-center justify-around">
            <div
              v-for="{ wallet, label, disabled } in wallets"
              :key="wallet"
              class="flex flex-col items-center space-y-4"
            >
              <WalletIcon
                :wallet="wallet"
                class="icon-in-modal"
                :class="{ 'filter grayscale': disabled }"
                :data-wallet="wallet"
              />
              <KlayButton
                :disabled="disabled"
                :loading="wallet === selectedWallet && (isProviderSetupPending || connectState?.pending)"
                @click="store.selectWallet(wallet)"
              >
                {{ label }}
              </KlayButton>
            </div>
          </div>

          <hr class="klay-divider">

          <div class="text-center py-8 space-y-4 text-sm">
            <p class="tip">
              Haven’t got a crypto wallet yet?
            </p>
            <p>
              <a
                class="learn-how"
                :href="CONFIG.uriConnectWalletGuide"
                target="_blank"
              >Learn How to Connect</a>
            </p>
          </div>
        </div>
      </template>
    </KlayModalCard>
  </SModal>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.icon-in-modal {
  font-size: 56px;

  &[data-wallet='kaikas'] {
    font-size: 67.2px;
  }
}

.tip {
  color: vars.$gray2;
}

.learn-how {
  color: vars.$blue;
}
</style>
