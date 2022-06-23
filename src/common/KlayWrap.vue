<script lang="ts">
export default {
  name: 'KlayWrap',
  props: {
    active: {
      type: String,
    },
  },
}
</script>

<template>
  <div class="wrap">
    <div class="head">
      <slot name="head">
        <RouterLink to="/swap" class="head--btn" active-class="head--btn-active">
          Swap
        </RouterLink>
        <RouterLink to="/liquidity" class="head--btn" active-class="head--btn-active">
          Liquidity
        </RouterLink>
      </slot>
      <button class="head--btn head--btn-left">
        <KlayIcon name="refresh" />
      </button>
      <button class="head--btn">
        <KlayIcon name="filters" />
      </button>
    </div>

    <slot />
  </div>
</template>

<style lang="scss" scoped>
.wrap {
  background: linear-gradient(0deg, #ffffff, #ffffff),
  linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.7) 0%,
      rgba(255, 255, 255, 0) 100%
  ),
  rgba(255, 255, 255, 0.6);
  box-shadow: 0px 20px 40px rgba(0, 0, 0, 0.05);
  padding: 19px 16px;
  border-radius: 20px;
  overflow: visible;
  margin: auto;
  max-width: 420px;
  width: 100%;
}

.load {
  width: min-content;
  margin: auto;
}

.head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 18px;

  &--btn {
    font-style: normal;
    font-weight: 700;
    font-size: 18px;
    line-height: 150%;
    color: $gray2;
    margin-right: 18px;
    cursor: pointer;

    &-left {
      margin-left: auto;
    }

    &:last-child {
      margin-right: 0;
    }

    &-active {
      color: $dark;
    }
  }
}

.change-btn {
  margin-top: -10px;
}

.margin-block {
  margin: -10px 0;
}

.slippage {
  margin: 20px 0;
}
</style>
