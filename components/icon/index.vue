<template>
  <div class="char" v-if="char">
    {{ char }}
  </div>
  <!-- eslint-disable vue/no-v-html -->
  <div
    v-else
    class="svg-icon"
    v-html="require(`@/assets/svg/${name}.svg?raw`)"
  />
  <!--eslint-enable-->
</template>

<script>
export default {
  name: "KlayIcon",
  props: {
    name: { type: String, default: "image" },
    char: { type: String },
  },
};
</script>

<style lang="scss" scoped>
.char {
  width: 24px;
  height:24px;
  background: $gray5;
  border-radius: 50%;
  font-weight: 700;
  text-align: center;
  padding-top: 6px;
  font-size: 12px;
  border: 1px solid $gray4;
}
</style>
