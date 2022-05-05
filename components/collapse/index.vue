<template>
  <div class="collapse">
    <div class="collapse--head" @click="isOpen = !isOpen">
      <slot name="head"></slot>
      <div class="icon-wrap" :style="{transform: `rotate(${isOpen ? 180 : 0}deg)`}">
        <Icon name="collapse-arrow" />
      </div>
    </div>
    <slot v-if="isOpen" name="main"></slot>
  </div>
</template>

<script>
export default {
  name: "KlayCollapse",
  data() {
    return {
      isOpen: false,
    }
  },
}
</script>

<style scoped lang="scss">
.collapse {
  border: 1px solid $gray3;
  box-sizing: border-box;
  border-radius: 8px;
  padding: 8px 16px;
  background: $white;
  text-align: left;

  &--head {
    width: 100%;
    display: flex;
    align-items: center;
  }

  & .icon-wrap {
    margin-left: auto;
    display: flex;
  }
}
</style>
