<script setup lang="ts" name="ModuleStakingPool">
import { Token } from '@/core';

const props = defineProps<{
  token: Token
}>()
const { token } = toRefs(props)
</script>

<template>
  <div class="">
    <KlayCharAvatar
      :symbol="token.symbol"
    />
    <div>
      <span> {{ token.symbol }} </span>
      <span> $0 </span>
    </div>
    <div>
      <span> {{ 0 }} </span>
      <span> $0 </span>
    </div>
  </div>
</template>