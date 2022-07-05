import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { createApolloProvider } from '@vue/apollo-option'
import type { Plugin } from '@/types'

const cache = new InMemoryCache()

const apolloClient = new ApolloClient({
  cache,
  uri: 'https://graph.ipfs1.dev.infra.soramitsu.co.jp/subgraphs/name/klaytn-subgraph/exchange',
})
const apolloProvider = createApolloProvider({
  defaultClient: apolloClient,
})

export const install: Plugin = ({ app }) => {
  app.use(apolloProvider)
}
