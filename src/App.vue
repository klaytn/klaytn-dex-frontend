<script setup lang="ts">
import DefaultLayout from './layouts/default.vue'
import CONFIG from '~config'

// https://github.com/vueuse/head
// you can use this to manipulate the document head in any components,
// they will be rendered correctly in the html results with vite-ssg
useHead({
  title: 'Dex',
  meta: [
    { name: 'description', content: 'Decentralized exchange platform' },
    {
      'http-equiv': 'content-security-policy',
      content: `
        default-src 'self' ${CONFIG.network.rpcUrl} ${CONFIG.subgraphs.exchange} ${CONFIG.subgraphs.farming} ${CONFIG.subgraphs.staking} ${CONFIG.subgraphs.snapshot};
        script-src 'self';
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com/;
        font-src 'self' https://fonts.gstatic.com/;
        img-src 'self';
        frame-src 'self';
      `,
    },
  ],
  link: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      href: '/favicon.svg',
    },
  ],
})
</script>

<template>
  <DefaultLayout />
</template>
