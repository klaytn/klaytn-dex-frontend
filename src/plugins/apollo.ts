import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { ApolloClientId, Plugin } from '@/types'
import { ApolloClients } from '@vue/apollo-composable'

const cache = new InMemoryCache()

const apolloClientExchange = new ApolloClient({
  cache,
  uri: import.meta.env.VITE_GRAPHQL_URI_EXCHANGE,
})

const apolloClientFarming = new ApolloClient({
  cache,
  uri: import.meta.env.VITE_GRAPHQL_URI_FARMING,
})

const apolloClientStaking = new ApolloClient({
  cache,
  uri: import.meta.env.VITE_GRAPHQL_URI_STAKING,
})

const apolloClientSnapshot = new ApolloClient({
  cache,
  uri: import.meta.env.VITE_GRAPHQL_URI_SNAPSHOT,
})

export const install: Plugin = ({ app }) => {
  app.provide(ApolloClients, {
    [ApolloClientId.Exchange]: apolloClientExchange,
    [ApolloClientId.Farming]: apolloClientFarming,
    [ApolloClientId.Staking]: apolloClientStaking,
    [ApolloClientId.Snapshot]: apolloClientSnapshot,
  })
}
