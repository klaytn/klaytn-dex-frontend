<template>
  <div class="collapse">
    <div class="collapse--head" @click="isOpen = !isOpen">
      <slot name="head"></slot>
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
}
</style>
