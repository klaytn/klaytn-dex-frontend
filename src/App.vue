<script setup lang="ts">
import { ApolloClients } from '@vue/apollo-composable'
import { SNotificationsProvider } from '@soramitsu-ui/ui'

import { apolloExchangeClient, apolloFarmingClient, apolloStakingClient } from '@/utils/apollo'

// https://github.com/vueuse/head
// you can use this to manipulate the document head in any components,
// they will be rendered correctly in the html results with vite-ssg
useHead({
  title: 'Dex',
  meta: [{ name: 'description', content: 'Decentralized exchange platform' }],
  link: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      href: '/favicon.svg',
    },
  ],
})

provide(ApolloClients, {
  exchange: apolloExchangeClient,
  farming: apolloFarmingClient,
  staking: apolloStakingClient,
})
</script>

<template>
  <SNotificationsProvider
    vertical="bottom"
    horizontal="right"
  >
    <RouterView />
    <NotificationsInit />
  </SNotificationsProvider>
</template>
