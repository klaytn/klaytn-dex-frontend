<route lang="yaml">
name: LiquidityAdd
</route>

<script setup lang="ts">
import invariant from 'tiny-invariant'
import { parseAddress } from '@/core/kaikas'

const route = useRoute()

const pairAddress = route.query.pair as undefined | string | string[]
if (pairAddress) {
  invariant(typeof pairAddress === 'string')
  const parsed = parseAddress(pairAddress)
}
</script>

<template>
  <div>
    {{ $route.q }}
  </div>
</template>
