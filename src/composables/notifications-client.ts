import type { ShowNotificationParams, ShowNotificationReturn } from '@soramitsu-ui/ui'

// FIXME why window injection...
window.$notify = () => {
  throw new Error("Notifications haven't been initialized yet")
}

/**
 * @deprecated FIXME no global mutations...
 */
export const $notify = function (params: ShowNotificationParams): ShowNotificationReturn {
  return window.$notify(params)
}
