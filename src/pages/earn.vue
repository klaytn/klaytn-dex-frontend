<route lang="yaml">
name: Earn
</route>

<script setup lang="ts" name="Earn">

const data = ref({
  stakedOnly: false
})

</script>

<template>
  <EarnWrap>
    <router-view v-bind="data" />
  </EarnWrap>
</template>