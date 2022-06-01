<template>
  <Wrap>
    <template v-slot:head>
      <RouterLink to="/liquidity" class="back">
        <Icon name="back-arrow" />
        <span v-if="isValid">
          Remove
          {{ selectedTokens.tokenA.symbol }}-{{ selectedTokens.tokenB.symbol }}
          liquidity
        </span>
      </RouterLink>
    </template>
    <template>
      <div class="add-liq">
        <LiquidityRemove v-if="isValid" />
        <Loader v-else />
      </div>
    </template>
  </Wrap>
</template>

<script>
import { mapActions, mapState } from "vuex";

export default {
  computed: {
    ...mapState("tokens", ["selectedTokens"]),
    isValid() {
      return this.selectedTokens?.tokenA && this.selectedTokens?.tokenB;
    },
  },
  methods: {
    ...mapActions({
      setSelectedTokensByPair: "tokens/setSelectedTokensByPair",
    }),
  },
  beforeMount() {
    this.setSelectedTokensByPair(this.$route.params.id);
  },
};
</script>

<style lang="scss" scoped>
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
