import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { ApolloClientId, Plugin } from '@/types'
import { ApolloClients } from '@vue/apollo-composable'
import CONFIG from '~config'

const cache = new InMemoryCache()

const apolloClientExchange = new ApolloClient({
  cache,
  uri: CONFIG.subgraphs.exchange,
})

const apolloClientFarming = new ApolloClient({
  cache,
  uri: CONFIG.subgraphs.farming,
})

const apolloClientStaking = new ApolloClient({
  cache,
  uri: CONFIG.subgraphs.staking,
})

const apolloClientSnapshot = new ApolloClient({
  cache,
  uri: CONFIG.subgraphs.snapshot,
})

export const install: Plugin = ({ app }) => {
  app.provide(ApolloClients, {
    [ApolloClientId.Exchange]: apolloClientExchange,
    [ApolloClientId.Farming]: apolloClientFarming,
    [ApolloClientId.Staking]: apolloClientStaking,
    [ApolloClientId.Snapshot]: apolloClientSnapshot,
  })
}
