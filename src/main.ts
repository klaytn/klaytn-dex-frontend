import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import 'uno.css'

import { setupLayouts } from 'virtual:generated-layouts'
import App from './App.vue'
import generatedRoutes from '~pages'

import './styles/soramitsu-ui.sass'
import './styles/main.sass'

const app = createApp(App)

const routes = setupLayouts(generatedRoutes)
const router = createRouter({ history: createWebHistory(), routes })
app.use(router)

Object.values(import.meta.globEager('./plugins/*.ts')).forEach((i) => i.install?.({ app, router, routes }))

app.mount('#app')
