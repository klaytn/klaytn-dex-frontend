<template>
  <LayoutBase>
    <h1 v-if="error.statusCode === 404">
      Page in the process of implementation
    </h1>
    <h1 v-else>An error occurred</h1>
    <NuxtLink to="/swap">Home page</NuxtLink>
  </LayoutBase>
</template>

<script>
export default {
  name: "KlayError",
  layout: "error",
  props: {
    error: {
      type: String,
      default: null,
    },
  },
}
</script>

<style>
h1 {
  font-size: 35px;
  text-align: center;
}
</style>
