<route lang="yaml">
name: Earn
path: /farms
</route>

<script setup lang="ts" name="Earn">
import EarnWrap from '@/components/EarnWrap.vue'
</script>

<template>
  <EarnWrap>
    <RouterView />
  </EarnWrap>
</template>
