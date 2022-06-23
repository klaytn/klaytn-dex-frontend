<script lang="ts">
export default {
  name: 'KlayButton',
  props: {
    loading: {
      type: Boolean,
    },
  },
}
</script>

<template>
  <button v-bind="$attrs" class="btn" :class="[{ loading }]">
    <slot />
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
    background: #8fbafb;
    cursor: default;
    &:hover {
      background: #8fbafb;
    }
  }

  &:hover {
    background: #3684f9;
  }
  &:active {
    background: #0263f5;
  }
  &:disabled {
    background: $disabled;
    cursor: default;
  }
}
</style>
