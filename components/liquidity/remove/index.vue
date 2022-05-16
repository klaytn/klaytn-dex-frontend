<template>
  <div class="rl--wrap">
    <div class="switch">
      <div
        @click="active = 'amount'"
        class="switch--item"
        :class="{ 'switch--item-active': active === 'amount' }"
      >
        Amount
      </div>
      <div
        @click="active = 'detailed'"
        class="switch--item"
        :class="{ 'switch--item-active': active === 'detailed' }"
      >
        Detailed
      </div>
    </div>

    <LiquidityRemoveAmount v-if="active === 'amount'" />
    <LiquidityRemoveDetailed v-if="active === 'detailed'" />

    <Button class="mt">Remove</Button>

    <div class="mt">
      <Collapse>
        <template #head>
          <div class="rl--collapse-label">LP tokens details</div>
        </template>
        <template #main>
          <div class="rl--row">
            <div>Klay</div>
            <div>0.1</div>
          </div>
          <div class="rl--row">
            <div>Klay</div>
            <div>0.13</div>
          </div>
          <div class="rl--row">
            <div>Klay per Flay</div>
            <div>0.132222</div>
          </div>
          <div class="rl--row">
            <div>Klay per Klay</div>
            <div>0.46781264135</div>
          </div>
        </template>
      </Collapse>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      active: "amount",
    };
  },
};
</script>

<style lang="scss" scoped src="./index.scss" />
