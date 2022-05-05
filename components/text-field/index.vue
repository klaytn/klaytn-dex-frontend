<template>
  <p class="text-field" v-bind="$attrs" v-on="$listeners">
    <slot></slot>
  </p>
</template>

<script>
export default {
  name: "TextField",
}
</script>

<style>
.text-field {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
