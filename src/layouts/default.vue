<script setup lang="ts" name="DefaultLayout">
import { type HeaderMenuItem, RouteName } from '@/types'

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
const { address, isNotInstalled } = toRefs(kaikasStore)
const { connectKaikas } = kaikasStore

const tokensStore = useTokensStore()
const { tokensList } = toRefs(tokensStore)
const { getTokens: loadTokensList } = tokensStore

const liquidityStore = useLiquidityStore()
const { pairs } = toRefs(liquidityStore)
const { getPairs: loadPairs } = liquidityStore

const formattedAddress = computed(() => {
  const addressLength = address.value.length
  return `${address.value.slice(2, 6)}...${address.value.slice(
    addressLength - 6,
    addressLength - 2,
  )}`
})

async function connect() {
  const kaikasAddress = await $kaikas.config.connectKaikas()
  if (kaikasAddress)
    connectKaikas(kaikasAddress)

  if (!tokensList.value.length)
    await loadTokensList()

  if (!pairs.value.length)
    await loadPairs()
}

onMounted(connect)
</script>

<template>
  <main class="layout">
    <!-- <notifications /> -->
    <header>
      <div class="col">
        <a href="#">
          <svg
            width="77"
            height="33"
            viewBox="0 0 77 33"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M35.28 24.088V20.26H37.92C38.6093 20.26 39.2253 20.1647 39.768 19.974C40.3253 19.7687 40.7947 19.4827 41.176 19.116C41.5573 18.7347 41.8507 18.28 42.056 17.752C42.2613 17.2093 42.364 16.6007 42.364 15.926C42.364 15.222 42.2613 14.606 42.056 14.078C41.8507 13.5353 41.5573 13.088 41.176 12.736C40.7947 12.3693 40.3253 12.098 39.768 11.922C39.2253 11.7313 38.6093 11.636 37.92 11.636H35.28V7.808H37.744C39.196 7.808 40.4647 8.01333 41.55 8.424C42.65 8.83467 43.5667 9.40667 44.3 10.14C45.0333 10.8587 45.5833 11.6947 45.95 12.648C46.3167 13.6013 46.5 14.6133 46.5 15.684V16.168C46.5 17.1507 46.3167 18.1187 45.95 19.072C45.5833 20.0107 45.0333 20.8613 44.3 21.624C43.5667 22.372 42.65 22.9733 41.55 23.428C40.4647 23.868 39.196 24.088 37.744 24.088H35.28ZM31.628 24.088V7.808H35.72V24.088H31.628ZM48.751 24V7.94H52.711V24H48.751ZM52.271 24V20.656H59.047V24H52.271ZM52.271 17.51V14.166H58.585V17.51H52.271ZM52.271 11.284V7.94H58.915V11.284H52.271ZM60.2746 24L65.5986 15.464L65.6426 15.816L60.7146 7.94H65.2026L67.9526 12.582H68.5246L71.1866 7.94H75.5426L70.6366 15.86L70.5706 15.508L76.0706 24H71.5826L68.3046 18.698H67.7326L64.6306 24H60.2746Z"
              fill="black"
            />
            <circle cx="12" cy="16" r="12" fill="black" />
          </svg>
        </a>
      </div>
      <div class="col col-center">
        <HeaderMenu :items="menu" />
      </div>

      <div class="col col-right">
        <div v-if="!isNotInstalled && !address" @click="connect">
          Connect
        </div>
        <div v-if="address" class="address">
          <svg
            width="18"
            height="19"
            viewBox="0 0 18 19"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M16 7.12305H2L2 16.123H16V7.12305ZM2 5.12305C0.895431 5.12305 0 6.01848 0 7.12305V16.123C0 17.2276 0.89543 18.123 2 18.123H16C17.1046 18.123 18 17.2276 18 16.123V7.12305C18 6.01848 17.1046 5.12305 16 5.12305H2Z"
              fill="#ADB9CE"
            />
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M2 6.4696L14 2.00179V6.03616H16V2.00179C16 0.607379 14.6089 -0.359051 13.3022 0.127486L1.30216 4.5953C0.519254 4.88679 0 5.63419 0 6.46961V16.123C0 17.2276 0.895431 18.123 2 18.123H8V16.123H2V6.4696Z"
              fill="#ADB9CE"
            />
            <circle cx="13.5176" cy="11.6407" r="1.5" fill="#ADB9CE" />
          </svg>
          <span>
            {{ formattedAddress }}
          </span>
        </div>
      </div>
    </header>
    <client-only>
      <div v-if="isNotInstalled">
        <h1>Install Kaikas before use swap</h1>
      </div>
      <div v-else-if="!address">
        <h1>Please connect Kaikas</h1>
      </div>
      <RouterView v-else />
    </client-only>
  </main>
</template>

<style scoped lang="scss">
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
