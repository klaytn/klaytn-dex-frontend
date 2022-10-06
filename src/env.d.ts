/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_GRAPHQL_URI_EXCHANGE: string
  readonly VITE_APP_GRAPHQL_URI_FARMING: string
  readonly VITE_APP_GRAPHQL_URI_STAKING: string
  readonly VITE_APP_GRAPHQL_URI_SNAPSHOT: string

  readonly VITE_APP_SNAPSHOT_SPACE: string

  readonly VITE_APP_DASHBOARDS_HREF: string
}
