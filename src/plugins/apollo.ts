import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import type { Plugin } from '@/types'
import { ApolloClients } from '@vue/apollo-composable'

const cache = new InMemoryCache()

const apolloClientExchange = new ApolloClient({
  cache,
  uri: import.meta.env.VITE_APP_GRAPHQL_URI_EXCHANGE,
})

const apolloClientFarming = new ApolloClient({
  cache,
  uri: import.meta.env.VITE_APP_GRAPHQL_URI_FARMING,
})

const apolloClientStaking = new ApolloClient({
  cache,
  uri: import.meta.env.VITE_APP_GRAPHQL_URI_STAKING,
})

export const install: Plugin = ({ app }) => {
  app.provide(ApolloClients, {
    exchange: apolloClientExchange,
    farming: apolloClientFarming,
    staking: apolloClientStaking,
  })
}
