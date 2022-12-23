<script setup lang="ts" name="DefaultLayout">
import { type HeaderMenuItem, RouteName } from '@/types'
import { KlayIconDexLogo, KlayIconDexLogoMobile } from '~klay-icons'
import { SToastsDisplay } from '@soramitsu-ui/ui'
import HeaderMenu from '@/components/HeaderMenu.vue'
import CONFIG from '~config'

// Good for tree-shaking
const TheHeaderDexToken = defineAsyncComponent(() => import('@/components/TheHeaderDexToken.vue'))
const TheWalletConnectModal = defineAsyncComponent(() => import('@/components/TheWalletConnectModal.vue'))
const TheHeaderWallet = defineAsyncComponent(() => import('@/components/TheHeaderWallet.vue'))
const TheDexInitGuard = defineAsyncComponent(() => import('@/components/TheDexInitGuard.vue'))
const TheNegativeNativeTokenGuard = defineAsyncComponent(() => import('@/components/TheNegativeNativeTokenGuard.vue'))

const { t } = useI18n()

const menu = computed<HeaderMenuItem[]>(() => {
  return [
    {
      label: t('DefaultLayout.menu.assets'),
      kind: 'route',
      routeName: RouteName.Assets,
      activeWith: [RouteName.Transactions],
    },
    {
      label: t('DefaultLayout.menu.trade'),
      routeName: RouteName.Swap,
      kind: 'route',
      activeWith: [RouteName.Trade, RouteName.Liquidity, RouteName.LiquidityAdd, RouteName.LiquidityRemove],
    },
    {
      label: t('DefaultLayout.menu.earn'),
      routeName: RouteName.Farms,
      kind: 'route',
      activeWith: [RouteName.Pools],
    },
    {
      label: t('DefaultLayout.menu.voting'),
      routeName: RouteName.Voting,
      kind: 'route',
      activeWith: [RouteName.VotingProposal],
    },
    {
      label: t('DefaultLayout.menu.charts'),
      kind: 'external',
      href: CONFIG.uriDashboards,
    },
  ]
})
</script>

<template>
  <TheDexInitGuard>
    <TheWalletConnectModal />
    <TheNegativeNativeTokenGuard />

    <main class="layout flex justify-center">
      <div class="lt-sm:w-full md:w-full sm:lt-md:w-452px lt-sm:px-2 lt-md:py-4 sm:lt-md:px-4 md:px-10 md:py-8">
        <header class="flex items-center justify-between mb-8 h-10 md:h-8">
          <div class="lg:flex-1">
            <router-link :to="{ name: RouteName.Swap }">
              <KlayIconDexLogo class="lt-md:hidden" />
              <KlayIconDexLogoMobile class="md:hidden" />
            </router-link>
          </div>
          <div class="flex justify-center lt-md:h-full lg:flex-1">
            <HeaderMenu :items="menu" />
          </div>

          <div class="w-306px h-full lg:flex-1 flex justify-end">
            <TheHeaderDexToken />
            <TheHeaderWallet />
          </div>
        </header>
        <RouterView />
      </div>
      <div
        class="toasts-mount fixed lt-sm:w-full md:w-full sm:lt-md:w-[452px] h-full top-36px lt-sm:px-2 lt-md:py-4 sm:lt-md:px-4 md:px-10 md:py-8"
      >
        <div class="relative">
          <SToastsDisplay
            :to="(null as any)"
            absolute
            vertical="top"
            horizontal="right"
          />
        </div>
      </div>
    </main>
  </TheDexInitGuard>
</template>

<style scoped lang="scss">
@use '@/styles/vars';

.layout {
  & h1 {
    font-size: 30px;
  }

  .address {
    padding: 7px 12px;
    background: vars.$white;
    font-style: normal;
    font-weight: 700;
    line-height: 150%;
    font-size: 12px;
    color: vars.$dark;
    border-radius: 10px;
    display: flex;
    align-items: center;

    & svg {
      margin-right: 8px;
    }
  }
}

.toasts-mount {
  pointer-events: none;
  z-index: 9999;

  & :deep(.s-toasts-display) {
    padding: 0;
  }
}
</style>
