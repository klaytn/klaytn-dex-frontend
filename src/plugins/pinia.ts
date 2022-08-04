import { createPinia } from 'pinia'
import { type Plugin } from '@/types'

// Setup Pinia
// https://pinia.esm.dev/
export const install: Plugin = ({ app }) => {
  const pinia = createPinia()
  app.use(pinia)
}
