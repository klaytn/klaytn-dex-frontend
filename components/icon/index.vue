<template>
  <!-- eslint-disable vue/no-v-html -->
  <div>
    <div class="svg-icon" v-html="require(`@/assets/svg/${name}.svg?raw`)" />
  </div>
  <!--eslint-enable-->
</template>

<script>
export default {
  name: "KlayIcon",
  props: {
    name: { type: String, default: "image" },
  },
}
</script>
