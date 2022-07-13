<template>
  <div class="row">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.row {
  display: flex;
  justify-content: space-between;
  font-style: normal;
  font-weight: 600;
  font-size: 12px;
  line-height: 230%;
  color: $dark2;
}
</style>
