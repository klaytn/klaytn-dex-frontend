<template>
  <div>
    <div class="svg-icon" v-html="require(`@/assets/svg/${name}.svg?raw`)" />
  </div>
</template>

<script>
export default {
  props: {
    name: { type: String, default: "image" },
  },
};
</script>
