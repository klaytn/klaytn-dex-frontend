import './print-git-revision'

// enable debug
if (import.meta.env.DEV) {
  localStorage.debug = '*'
}

import { createApp } from 'vue'
import 'uno.css'
import './styles/main.sass'
import App from './App.vue'
import { Plugin } from './types'
import router from './router'

const app = createApp(App)
app.use(router)

for (const { install } of Object.values<{ install: Plugin }>(import.meta.glob('./plugins/*.ts', { eager: true }))) {
  install({ app, router })
}

app.mount('#app')
