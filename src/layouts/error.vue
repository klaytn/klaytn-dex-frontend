<script>
export default {
  name: 'ErrorLayout',
  props: {
    error: {
      type: String,
      default: null,
    },
  },
}
</script>

<template>
  <LayoutBase>
    <h1 v-if="error.statusCode === 404">
      Page in the process of implementation
    </h1>
    <h1 v-else>
      An error occurred
    </h1>
    <router-link to="/swap">
      Home page
    </router-link>
  </LayoutBase>
</template>

<style>
h1 {
  font-size: 35px;
  text-align: center;
}
</style>
