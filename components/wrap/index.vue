<template>
  <div class="wrap">
    <div class="head">
      <RouterLink to="swap" class="head--btn" active-class="head--btn-active">Swap</RouterLink>
      <RouterLink to="liquidity" class="head--btn" active-class="head--btn-active">Liquidity</RouterLink>
      <button class="head--btn head--btn-left">
        <Icon name="refresh" />
      </button>
      <button class="head--btn">
        <Icon name="filters" />
      </button>
    </div>

    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'KlaytnWrap',
  props: {
    active: {
      type: String
    }
  }
}
</script>

<style lang="scss" scoped src="./index.scss"></style>
