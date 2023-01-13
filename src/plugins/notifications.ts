import { Plugin } from '@/types'
import { TOASTS_API_KEY, ToastsApi, defineToastsApi } from '@soramitsu-ui/ui'
import KlayToast from '@/components/common/KlayToast.vue'
import invariant from 'tiny-invariant'

const KlayToasts = defineToastsApi()

interface NotifyProps {
  type: 'err' | 'ok'
  title?: string
  description?: string
  error?: unknown
  action?: {
    title: string
    fn: () => void
  }
}

export type NotifyFn = (props: NotifyProps) => void

const DEFAULT_NOTIFICATION_TIMEOUT = 5_000

function notify(toasts: ToastsApi, props: NotifyProps) {
  const unregister = toasts.register({
    slot: () =>
      h(KlayToast, {
        type: props.type,
        title: props.title,
        description: props.description,
        error: props.error,
        action: props.action?.title,
        'onClick:close': () => unregister(),
        'onClick:action': () => props.action?.fn(),
      }),
  })

  setTimeout(unregister, DEFAULT_NOTIFICATION_TIMEOUT)
}

function createNotify(toasts: ToastsApi): NotifyFn {
  return (props: NotifyProps) => notify(toasts, props)
}

/**
 * Inject Klay Notifications API
 */
export function useNotify() {
  const toasts = inject(TOASTS_API_KEY)
  invariant(toasts, 'Unable to use notifications - toasts api is not provided')
  return { notify: createNotify(toasts) }
}

/**
 * **WARNING!** Should be used with caution and only
 * where it is impossible to `useNotify()`.
 */
export const notifyGlobal = createNotify(KlayToasts)

export const install: Plugin = ({ app }) => {
  app.provide(TOASTS_API_KEY, KlayToasts)
}
