import type Caver from 'caver-js'
import type { ShowNotificationParams, ShowNotificationReturn } from '@soramitsu-ui/ui'
import type { Klaytn } from '@/types'

declare global {
  interface Window {
    // extend the window
    $notify: (params: ShowNotificationParams) => ShowNotificationReturn
    caver: Caver
    klaytn: Klaytn
  }
  interface HTMLElement {
    bemClassList?: string[]
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
