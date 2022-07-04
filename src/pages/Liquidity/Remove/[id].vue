<script lang="ts" setup>
import { parseAddress } from '@/core/kaikas'
import { toRefs } from '@vueuse/core'

const tokensStore = useTokensStore()
const { tokenA, tokenB } = $(toRefs(toRef(tokensStore, 'selectedTokens')))

const route = useRoute()
tokensStore.setSelectedTokensByPair(parseAddress(route.params.id as string))
</script>

<template>
  <KlayWrap>
    <template #head>
      <RouterLink
        to="/liquidity"
        class="back"
      >
        <KlayIcon name="back-arrow" />
        <span v-if="tokenA && tokenB">
          Remove
          {{ tokenA.symbol }}-{{ tokenB.symbol }}
          liquidity
        </span>
      </RouterLink>
    </template>
    <div class="add-liq">
      <LiquidityModuleRemove v-if="tokenA && tokenB" />
      <div
        v-else
        class="loader-wrapper"
      >
        <KlayLoader />
      </div>
    </div>
  </KlayWrap>
</template>

<style lang="scss" scoped>
.loader-wrapper {
  margin: 20px auto;
  width: min-content;
}
.back {
  font-weight: 700;
  font-size: 18px;
  line-height: 22px;
  color: $dark2;
  display: flex;
  align-items: center;

  & span {
    margin-left: 11px;
  }
}
</style>

<route lang="yaml">
name: LiquidityRemove
</route>
