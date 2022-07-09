<script setup lang="ts" name="DefaultLayout">
import { formatAddress } from '@/core/kaikas'
import { type HeaderMenuItem, RouteName } from '@/types'
import { storeToRefs } from 'pinia'
import IconWallet from '@/assets/icons/wallet.svg'
import IconDexLogo from '@/assets/icons/dex-logo.svg'

const { t } = useI18n()

const menu = computed<HeaderMenuItem[]>(() => {
  return [
    {
      label: t('defaultLayout.links.assets'),
      routeName: RouteName.Assets,
    },
    {
      label: t('defaultLayout.links.trade'),
      routeName: RouteName.Swap,
      activeWith: [RouteName.Liquidity, RouteName.LiquidityAdd, RouteName.LiquidityRemove],
    },
    {
      label: t('defaultLayout.links.earn'),
      routeName: RouteName.Farms,
      activeWith: [RouteName.Pools],
    },
    {
      label: t('defaultLayout.links.voting'),
      routeName: RouteName.Voting,
    },
    {
      label: t('defaultLayout.links.charts'),
      routeName: RouteName.Charts,
    },
  ]
})

const kaikasStore = useKaikasStore()
const { address, isNotInstalled } = storeToRefs(kaikasStore)

const tokensStore = useTokensStore()

const formattedAddress = computed(() => {
  if (!address.value) return ''
  return formatAddress(address.value)
})

async function connect() {
  await kaikasStore.connect()

  if (kaikasStore.status === 'connected') {
    tokensStore.getUserBalance()
    tokensStore.getImportedTokens()
  }
}

onMounted(connect)
</script>

<template>
  <main class="layout">
    <!-- <notifications /> -->
    <header>
      <div class="col">
        <a href="#">
          <IconDexLogo />
        </a>
      </div>
      <div class="col col-center">
        <HeaderMenu :items="menu" />
      </div>

      <div class="col col-right">
        <div
          v-if="isNotInstalled || !address"
          @click="connect"
        >
          Connect
        </div>
        <div
          v-if="address"
          class="address"
        >
          <IconWallet />
          <span>
            {{ formattedAddress }}
          </span>
        </div>
      </div>
    </header>

    <RouterView />
  </main>
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
    margin-bottom: 82px;

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
</style>
