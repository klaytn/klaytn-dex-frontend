import { createHead } from '@vueuse/head'
import type { Plugin } from '@/types'

// vueuse/head https://github.com/vueuse/head
export const install: Plugin = ({ app }) => {
  const head = createHead()
  app.use(head)
}
