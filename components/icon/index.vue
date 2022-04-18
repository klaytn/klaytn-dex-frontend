<template>
  <div class="svg-icon" v-html="require(`@/assets/svg/${name}.svg?raw`)" />
</template>

<script>
export default {
  props: {
    name: { type: String, default: "image" },
  },
};
</script>
