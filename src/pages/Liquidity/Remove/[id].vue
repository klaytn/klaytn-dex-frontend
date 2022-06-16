<script>
import { mapActions, mapState } from 'pinia'

export default {
  name: 'LiquidityRemove',
  computed: {
    ...mapState(useTokensStore, ['selectedTokens']),
    isValid() {
      return this.selectedTokens?.tokenA && this.selectedTokens?.tokenB
    },
  },
  beforeMount() {
    this.setSelectedTokensByPair(this.$route.params.id)
  },
  methods: {
    ...mapActions(useTokensStore, ['setSelectedTokensByPair']),
  },
}
</script>

<template>
  <KlayWrap>
    <template #head>
      <RouterLink to="/liquidity" class="back">
        <KlayIcon name="back-arrow" />
        <span v-if="isValid">
          Remove
          {{ selectedTokens.tokenA.symbol }}-{{ selectedTokens.tokenB.symbol }}
          liquidity
        </span>
      </RouterLink>
    </template>
    <div class="add-liq">
      <LiquidityModuleRemove v-if="isValid" />
      <div v-else class="loader-wrapper">
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
