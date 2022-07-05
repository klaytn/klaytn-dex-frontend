import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import { setupLayouts } from 'virtual:generated-layouts'
import App from './App.vue'
import generatedRoutes from '~pages'

window.$notify = () => {
  throw new Error("Notifications haven't been initialized yet")
}

import './styles/soramitsu-ui.sass'
import './styles/main.sass'

const app = createApp(App)

const routes = setupLayouts(generatedRoutes)
const router = createRouter({ history: createWebHistory(), routes })
app.use(router)

Object.values(import.meta.globEager('./plugins/*.ts')).map((i) => i.install?.({ app, router, routes }))

app.mount('#app')
