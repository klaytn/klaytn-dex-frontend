import { type Status, useNotifications } from '@soramitsu-ui/ui'

export const $notify = function ({ type, text }: { type: Status; text: string }) {
  console.log(text)
  // const { show } = useNotifications()
  // show({
  //   status: type,
  //   descriptionSlot: () => [text],
  // })
}
