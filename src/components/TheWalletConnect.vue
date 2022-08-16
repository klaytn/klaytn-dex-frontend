<script setup lang="ts">
import { formatAddress, isKaikasDetected, SupportedWallet } from '@/core'
import { SModal, SPopover } from '@soramitsu-ui/ui'
import { not, and } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { KlayIconKaikas } from '~klay-icons'
import IconLogosMetamask from '~icons/logos/metamask-icon'

const store = useDexStore()
const {
  isMetamaskDetected,
  account,
  selectedWallet,
  connectState,
  isChainCorrect,
  isChainLoaded,
  isProviderSetupPending,
} = storeToRefs(store)

const openModal = ref(false)
whenever(
  () => !!connectState.value?.fulfilled,
  () => {
    openModal.value = false
  },
)

const showWalletWarning = and(isChainLoaded, not(isChainCorrect))

const addressFormatted = computed(() => account.value && formatAddress(account.value))

interface Wallet {
  wallet: 'metamask' | 'kaikas'
  label: string
  disabled: boolean
}

function walletIcon(wallet: SupportedWallet) {
  return wallet === 'metamask' ? IconLogosMetamask : KlayIconKaikas
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
  <KlayButton
    v-if="!selectedWallet"
    type="primary"
    size="sm"
    @click="openModal = true"
  >
    Connect Wallet
  </KlayButton>

  <SPopover
    v-else
    placement="bottom"
    distance="8"
  >
    <template #trigger>
      <div
        class="wallet rounded-lg p-2 flex items-center space-x-2 cursor-pointer"
        :class="{ 'wallet--warning': showWalletWarning }"
      >
        <component
          :is="walletIcon(selectedWallet)"
          class="text-xl"
        />

        <KlayLoader
          v-if="isProviderSetupPending"
          size="20"
        />

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

  <SModal v-model:show="openModal">
    <KlayModalCard
      title="Connect Wallet"
      class="w-[344px]"
    >
      <template #body>
        <div>
          <div class="p-8 flex items-center justify-around">
            <div
              v-for="{ wallet, label, disabled } in wallets"
              :key="wallet"
              class="flex flex-col items-center space-y-4"
            >
              <component
                :is="walletIcon(wallet)"
                class="icon-in-modal"
                :class="{ ' filter grayscale': disabled }"
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
            <p><a class="learn-how">Learn How to Connect</a></p>
            <i class="text-xs">todo add a link</i>
          </div>
        </div>
      </template>
    </KlayModalCard>
  </SModal>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.wallet {
  background: white;
}

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

.address {
  font-size: 12px;
  font-weight: 700;
}

.popper {
  box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.15);
}
</style>
