import { ApolloClient, InMemoryCache } from '@apollo/client/core'

const cache = new InMemoryCache()

function getUri(clientName: string) {
  return `http://localhost:8000/subgraphs/name/klaytn-subgraph/${clientName}`
}

export const apolloExchangeClient = new ApolloClient({
  cache,
  uri: getUri('exchange'),
})

export const apolloFarmingClient = new ApolloClient({
  cache,
  uri: getUri('farming'),
})
