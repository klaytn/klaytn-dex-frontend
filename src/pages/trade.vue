<route lang="yaml">
name: Trade
</route>

<script setup lang="ts">
import { RouteName } from '@/types'
import { storeToRefs } from 'pinia'

const tokensStore = useTokensStore()
const { isBalancePending, isImportedPending, isImportedLoaded } = $(storeToRefs(tokensStore))

const route = useRoute()
const isOnLiquidityAdd = $computed(() => route.name === RouteName.LiquidityAdd)

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

function refresh() {
  tokensStore.touchUserBalance()
}
</script>

<template>
  <div class="wrap mx-auto pb-5">
    <div class="flex items-center mb-4 space-x-4 pt-5 px-4">
      <template v-if="isOnLiquidityAdd">
        <RouterLink :to="{ name: RouteName.Liquidity }">
          <KlayButton
            type="action"
            rounded
          >
            <template #icon>
              <IconKlayBackArrow />
            </template>
          </KlayButton>
        </RouterLink>

        <h1>Add Liquidity</h1>
      </template>

      <template v-else>
        <RouterLink
          v-for="item in headLinks"
          :key="item.toName"
          :to="{ name: item.toName }"
          class="link"
          active-class="link--active"
        >
          {{ item.label }}
        </RouterLink>
      </template>

      <div class="flex-1" />

      <KlayButton
        type="action"
        rounded
        :loading="isBalancePending || isImportedPending"
        @click="refresh"
      >
        <template #icon>
          <IconKlayRefresh />
        </template>
      </KlayButton>

      <KlayButton
        type="action"
        rounded
        disabled
      >
        <template #icon>
          <IconKlayFilters />
        </template>
      </KlayButton>
    </div>

    <div
      v-if="!isImportedLoaded && isImportedPending"
      class="p-8 flex items-center justify-center"
    >
      <KlayLoader />
    </div>

    <RouterView v-else />
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

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
  color: $dark;
}

.link {
  font-style: normal;
  font-weight: 700;
  font-size: 18px;
  line-height: 150%;
  color: $gray2;

  &--active {
    color: $dark;
  }
}

.head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 18px;

  &__btn {
  }
}
</style>
