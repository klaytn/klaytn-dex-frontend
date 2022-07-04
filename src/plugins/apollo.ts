import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { createApolloProvider } from '@vue/apollo-option'
import { DefaultApolloClient } from '@vue/apollo-composable'
import type { Plugin } from '@/types'

const cache = new InMemoryCache()

const client = new ApolloClient({
  cache,
  uri: import.meta.env.VITE_APP_GRAPHQL_URI,
})

export const install: Plugin = ({ app }) => {
  // for Options API
  app.use(
    createApolloProvider({
      defaultClient: client,
    }),
  )

  // for Composition API
  app.provide(DefaultApolloClient, client)
}
