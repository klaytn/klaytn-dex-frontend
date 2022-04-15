<template>
  <button v-bind="$attrs" v-on="$listeners" class="btn" :class="{loading: loading}">
    <slot></slot>
  </button>
</template>

<style lang="scss" scoped>
.btn {
  background: $blue;
  border: none;
  cursor: pointer;
  padding: 13px 13px;
  font-style: normal;
  font-weight: 700;
  font-size: 20px;
  color: $white;
  border-radius: 16px;
  line-height: 150%;
  max-width: 388px;
  width: 100%;

  &.loading {
    background: #8FBAFB;
    cursor: default;
    &:hover {
      background: #8FBAFB;
    }
  }

  &:hover {
    background: #3684F9;
  }
  &:active {
    background: #0263F5;
  }
  &:disabled {
    background: $disabled;
    cursor: default;
  }
}
</style>

<script>
export default {
  name: 'Button',
  props: {
    loading: {
      type: Boolean,
      required: false
    }
  }
}
</script>
