/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GIT?: string
  readonly VITE_ROUTER_HASH_MODE?: 'TRUE' | 'FALSE'
}
