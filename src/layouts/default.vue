<script setup lang="ts" name="DefaultLayout">
import { type HeaderMenuItem, RouteName } from '@/types'
import { KlayIconDexLogo } from '~klay-icons'
import { SToastsDisplay } from '@soramitsu-ui/ui'
import HeaderMenu from '@/components/HeaderMenu.vue'

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
      href: import.meta.env.VITE_APP_DASHBOARDS_HREF,
    },
  ]
})
</script>

<template>
  <TheDexInitGuard>
    <TheWalletConnectModal />
    <TheNegativeNativeTokenGuard />

    <main class="layout">
      <header class="relative">
        <div class="col">
          <a href="#">
            <KlayIconDexLogo />
          </a>
        </div>
        <div class="col col-center">
          <HeaderMenu :items="menu" />
        </div>

        <div class="col col-right">
          <TheHeaderDexToken />
          <TheHeaderWallet />
        </div>

        <div class="toasts-mount absolute right-0 bottom-0 w-full">
          <SToastsDisplay
            :to="(null as any)"
            absolute
            vertical="top"
            horizontal="right"
          />
        </div>
      </header>

      <RouterView />
    </main>
  </TheDexInitGuard>
</template>

<style scoped lang="scss">
@import '@/styles/vars';

.layout {
  padding: 40px 82px;

  & h1 {
    font-size: 30px;
  }

  & header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;

    & .col {
      width: 33.33%;
      display: flex;
    }

    & .col-center {
      justify-content: center;
    }

    & .col-right {
      justify-content: flex-end;
    }
  }

  .address {
    padding: 7px 12px;
    background: $white;
    font-style: normal;
    font-weight: 700;
    line-height: 150%;
    font-size: 12px;
    color: $dark;
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
