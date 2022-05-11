<template>
  <div class="details--wrap">
    <Collapse>
      <template #head> <h3 class="details--title">Transaction Details</h3> </template>
      <template #main>
        <div class="details" v-if="isValid">
          <h3>Prices and pool share</h3>

          <!--    <div class="liquidity&#45;&#45;details&#45;&#45;row">-->
          <!--      <span>-->
          <!--        {{ selectedTokens.tokenA.symbol }} per-->
          <!--        {{ selectedTokens.tokenB.symbol }}-->
          <!--      </span>-->
          <!--      <span>-->
          <!--        {{-->
          <!--          getFormattedRate(-->
          <!--            selectedTokens.tokenA.value,-->
          <!--            selectedTokens.tokenB.value-->
          <!--          )-->
          <!--        }}-->
          <!--      </span>-->
          <!--    </div>-->
          <!--    <div class="liquidity&#45;&#45;details&#45;&#45;row">-->
          <!--        <span-->
          <!--        >{{ selectedTokens.tokenB.symbol }} per-->
          <!--          {{ selectedTokens.tokenA.symbol }}</span-->
          <!--        >-->
          <!--      <span>-->
          <!--          {{ getFormattedRate(selectedTokens.tokenB.value, selectedTokens.tokenA.value) }}-->
          <!--        </span>-->
          <!--    </div>-->
          <!--    <div v-if="selectedTokens.pairBalance" class="liquidity&#45;&#45;details&#45;&#45;row">-->
          <!--      <span>Share of pool</span>-->
          <!--      <span>{{getFormattedPercent(selectedTokens.pairBalance, selectedTokens.userBalance)}}</span>-->
          <!--    </div>-->
          <div class="details--row">
            <span>You'll earn</span>
            <span>0.17%</span>
          </div>

          <div class="details--row">
            <span>Transaction Fee</span>
            <span>0.074 KLAY ($0.013)</span>
          </div>
        </div>
      </template>
    </Collapse>
  </div>
</template>

<script>
export default {
  computed: {
    isValid() {
      return true;
    },
  },
};
</script>

<style scoped lang="scss" src="./details.scss"></style>
