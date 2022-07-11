import type { ShowNotificationParams, ShowNotificationReturn } from '@soramitsu-ui/ui'

/**
 * @deprecated FIXME no global mutations...
 */
export const $notify = function (params: ShowNotificationParams): ShowNotificationReturn {
  return window.$notify(params)
}
