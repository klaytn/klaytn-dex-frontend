import { type Plugin } from '@/types'
import * as Sentry from '@sentry/vue'
import { BrowserTracing } from '@sentry/tracing'
import CONFIG from '~config'

// Setup Sentry
// https://sentry.io/
export const install: Plugin = ({ app, router }) => {
  Sentry.init({
    app,
    dsn: CONFIG.sentryDSN,
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
        tracingOrigins: ['dex.baobab.klaytn.net'],
      }),
    ],
    tracesSampleRate: 1.0,
  })
}
