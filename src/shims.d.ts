import type { ShowNotificationParams, ShowNotificationReturn } from '@soramitsu-ui/ui'

declare global {
  interface Window {
    // extend the window
    $notify: (params: ShowNotificationParams) => ShowNotificationReturn
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
