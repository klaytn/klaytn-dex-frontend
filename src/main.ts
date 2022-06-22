import { ViteSSG } from 'vite-ssg'
import { setupLayouts } from 'virtual:generated-layouts'
import App from './App.vue'
import generatedRoutes from '~pages'

import './styles/soramitsu-ui.sass'
import './styles/main.sass'

const routes = setupLayouts(generatedRoutes)

// https://github.com/antfu/vite-ssg
export const createApp = ViteSSG(
  App,
  { routes, base: import.meta.env.BASE_URL },
  (ctx) => {
    // install all plugins under `plugins/`
    Object.values(import.meta.globEager('./plugins/*.ts')).forEach(i => i.install?.(ctx))
  },
)
