/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GRAPHQL_URI_EXCHANGE: string
  readonly VITE_GRAPHQL_URI_FARMING: string
  readonly VITE_GRAPHQL_URI_STAKING: string
  readonly VITE_GRAPHQL_URI_SNAPSHOT: string

  readonly VITE_SNAPSHOT_SPACE: string

  readonly VITE_DASHBOARDS_HREF: string

  readonly VITE_GIT?: string

  readonly VITE_ROUTER_HASH_MODE?: 'TRUE' | 'FALSE'
}
