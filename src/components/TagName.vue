<script lang="ts">
export default {
  name: 'TagName',
  props: {
    label: {
      type: String,
      required: true,
    },
  },
}
</script>

<template>
  <div class="tag-name">
    <div class="tag-name--content">
      <slot />
    </div>
    <span>{{ label }}</span>
  </div>
</template>

<style lang="scss" scoped>
.tag-name {
  display: flex;
  align-items: center;
  background: $white;
  box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  width: min-content;
  padding: 8px 12px;

  &--content {
    margin-right: 5px;
    min-width: 24px;
  }

  & span {
    white-space: nowrap;
    font-style: normal;
    font-weight: 600;
    font-size: 14px;
    line-height: 17px;
    color: $dark2;
  }
}
</style>
