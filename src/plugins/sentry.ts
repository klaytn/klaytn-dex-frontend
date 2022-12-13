import { type Plugin } from '@/types'
import * as Sentry from '@sentry/vue'
import { BrowserTracing } from '@sentry/tracing'

// Setup Sentry
// https://sentry.io/
export const install: Plugin = ({ app, router }) => {
  Sentry.init({
    app,
    dsn: import.meta.env.SENTRY_DSN,
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
        tracingOrigins: import.meta.env.SENTRY_TRACING_ORIGIN ? [import.meta.env.SENTRY_TRACING_ORIGIN] : [],
      }),
    ],
    tracesSampleRate: 1.0,
  })
}
