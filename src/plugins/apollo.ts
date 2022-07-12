import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import type { Plugin } from '@/types'
import { ApolloClients } from '@vue/apollo-composable'

const cache = new InMemoryCache()

const apolloExchangeClient = new ApolloClient({
  cache,
  uri: import.meta.env.VITE_APP_GRAPHQL_URI_EXCHANGE,
})

const apolloFarmingClient = new ApolloClient({
  cache,
  uri: import.meta.env.VITE_APP_GRAPHQL_URI_FARMING,
})

export const install: Plugin = ({ app }) => {
  app.provide(ApolloClients, {
    exchange: apolloExchangeClient,
    farming: apolloFarmingClient,
  })
}
