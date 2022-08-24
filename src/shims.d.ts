/* eslint-disable no-duplicate-imports */

import type Caver from 'caver-js'
import { type Kaikas } from '@/core/types'

declare global {
  interface Window {
    caver?: Caver
    klaytn?: Kaikas
  }
  interface HTMLElement {
    bemClassList?: Record<string, Set<string>>
  }
}

// with vite-plugin-md, markdown files can be treated as Vue components
declare module '*.md' {
  import { type DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '*.vue' {
  import { type DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
