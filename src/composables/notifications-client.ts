import type { ShowNotificationParams, ShowNotificationReturn } from '@soramitsu-ui/ui'

export const $notify = function (params: ShowNotificationParams): ShowNotificationReturn {
  return window.$notify(params)
}
