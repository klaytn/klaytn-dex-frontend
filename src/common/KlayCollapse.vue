<script lang="ts">
export default {
  name: 'KlayCollapse',
  data() {
    return {
      isOpen: false,
    }
  },
}
</script>

<template>
  <div class="collapse">
    <div class="collapse--head" @click="isOpen = !isOpen">
      <slot name="head" />
      <div class="icon-wrap" :style="{ transform: `rotate(${isOpen ? 180 : 0}deg)` }">
        <KlayIcon name="collapse-arrow" />
      </div>
    </div>
    <slot v-if="isOpen" name="main" />
  </div>
</template>

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
    cursor: pointer;
  }

  & .icon-wrap {
    margin-left: auto;
    display: flex;
  }
}
</style>
