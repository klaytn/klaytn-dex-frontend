<script setup lang="ts">
import { useTradeStore } from '@/modules/ModuleTradeShared/trade-store'
import { RouteName } from '@/types'
import invariant from 'tiny-invariant'
import { KlayIconBackArrow, KlayIconFilters, KlayIconRefresh } from '~klay-icons'
import TheTokensApiProvider from '@/components/TheTokensApiProvider.vue'

// const tokensStore = useTokensStore()
// const { isBalancePending, isImportedPending } = storeToRefs(tokensStore)

const removeStore = useLiquidityRmStore()

const route = useRoute()

const liquiditySubSection = computed(() => {
  if (route.name === RouteName.LiquidityAdd) {
    return { kind: 'add', label: 'Add Liquidity' }
  }
  if (route.name === RouteName.LiquidityRemove) {
    const symbols = removeStore.selectedTokensSymbols

    return {
      kind: 'remove',
      label: `Remove ${symbols ? `${symbols.tokenA}-${symbols.tokenB}` : '...'} liquidity`,
    }
  }
})

const isSwapActive = computed(() => route.name === RouteName.Swap)

const headLinks: {
  toName: RouteName
  label: string
}[] = [
  {
    toName: RouteName.Swap,
    label: 'Swap',
  },
  {
    toName: RouteName.Liquidity,
    label: 'Liquidity',
  },
]

const tradeStore = useTradeStore()

const showRefreshButton = computed(() => !!tradeStore.refresh)
const isRefreshing = computed(() => unref(tradeStore.refresh?.pending) ?? false)

function refresh() {
  const api = tradeStore.refresh
  invariant(api)
  api.run()
}
</script>

<template>
  <TheTokensApiProvider>
    <div class="wrap mx-auto pb-5">
      <div class="flex items-center mb-4 space-x-4 pt-5 px-4">
        <template v-if="liquiditySubSection">
          <RouterLink :to="{ name: RouteName.Liquidity }">
            <KlayButton
              type="action"
              rounded
            >
              <template #icon>
                <KlayIconBackArrow />
              </template>
            </KlayButton>
          </RouterLink>

          <h1>
            {{ liquiditySubSection.label }}
          </h1>
        </template>

        <template v-else>
          <RouterLink
            v-for="item in headLinks"
            :key="item.toName"
            :to="{ name: item.toName }"
            class="link"
            exact-active-class="link--active"
          >
            {{ item.label }}
          </RouterLink>
        </template>

        <div class="flex-1" />

        <ModuleSwapModalPreferences v-slot="{ open }">
          <KlayButton
            v-if="isSwapActive"
            type="action"
            rounded
            @click="open()"
          >
            <template #icon>
              <KlayIconFilters />
            </template>
          </KlayButton>
        </ModuleSwapModalPreferences>

        <KlayButton
          v-if="showRefreshButton"
          type="action"
          rounded
          :loading="isRefreshing"
          @click="refresh"
        >
          <template #icon>
            <KlayIconRefresh />
          </template>
        </KlayButton>
      </div>

      <RouterView />
    </div>
  </TheTokensApiProvider>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.wrap {
  background: linear-gradient(0deg, #ffffff, #ffffff),
    linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 100%), rgba(255, 255, 255, 0.6);
  box-shadow: 0px 20px 40px rgba(0, 0, 0, 0.05);
  border-radius: 20px;
  max-width: 420px;
  width: 100%;
}

h1 {
  font-style: normal;
  font-weight: 700;
  font-size: 18px;
  line-height: 150%;
  color: vars.$dark;
}

.link {
  font-style: normal;
  font-weight: 700;
  font-size: 18px;
  line-height: 150%;
  color: vars.$gray2;

  &--active {
    color: vars.$dark;
  }
}

.head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 18px;
}
</style>
