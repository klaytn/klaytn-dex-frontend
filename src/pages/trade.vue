<route lang="yaml">
name: Trade
</route>

<script setup lang="ts">
import { RouteName } from '@/types'
import { storeToRefs } from 'pinia'
import IconRefresh from '@/assets/icons/refresh.svg'
import IconFilters from '@/assets/icons/filters.svg'

const tokensStore = useTokensStore()
const { isDataLoading: isLoading, doesDataExist } = $(storeToRefs(tokensStore))

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
  tokensStore.getImportedTokens()
  tokensStore.getUserBalance()
}
</script>

<template>
  <div class="wrap mx-auto">
    <div class="flex items-center mb-4 space-x-4 pt-5 px-4">
      <template v-if="isOnLiquidityAdd">
        add liquidity?
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
        :loading="isLoading"
        @click="refresh"
      >
        <template #icon>
          <IconRefresh />
        </template>
      </KlayButton>

      <KlayButton
        type="action"
        rounded
        disabled
      >
        <template #icon>
          <IconFilters />
        </template>
      </KlayButton>
    </div>

    <div
      v-if="isLoading && !doesDataExist"
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
