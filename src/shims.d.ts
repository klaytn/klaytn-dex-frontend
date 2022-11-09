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

declare module '*.vue' {
  import { type DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
