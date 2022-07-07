import { ApolloClient, InMemoryCache } from '@apollo/client/core'

const cache = new InMemoryCache()

function getUri(clientName: string) {
  return `https://graph.ipfs1.dev.infra.soramitsu.co.jp/subgraphs/name/klaytn-subgraph/${clientName}`
}

export const apolloExchangeClient = new ApolloClient({
  cache,
  uri: getUri('exchange'),
})

export const apolloFarmingClient = new ApolloClient({
  cache,
  uri: getUri('farming'),
})
