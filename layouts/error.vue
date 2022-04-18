<template>
  <LayoutBase>
    <h1 v-if="error.statusCode === 404">Page in the process of implementation</h1>
    <h1 v-else>An error occurred</h1>
    <NuxtLink to="/swap">Home page</NuxtLink>
  </LayoutBase>
</template>


<script>
export default {
  props: ['error'],
  layout: 'error' // you can set a custom layout for the error page
}
</script>

<style>
h1 {
  font-size: 35px;
  text-align: center;
}
</style>
