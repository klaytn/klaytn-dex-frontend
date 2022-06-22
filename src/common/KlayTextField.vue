<script>
export default {
  name: 'KlayTextField',
}
</script>

<template>
  <p class="text-field" v-bind="$attrs">
    <slot />
  </p>
</template>

<style>
.text-field {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
