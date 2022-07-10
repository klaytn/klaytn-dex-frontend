import type { Fn, MaybeRef, IntervalFnOptions } from '@vueuse/core'

export const copyToClipboard = (value: string) => {
  /* Create the text field */
  const copyText = document.createElement('input')
  copyText.focus()
  copyText.value = value
  /* Select the text field */
  copyText.select()
  copyText.setSelectionRange(0, 99999) /* For mobile devices */
  /* Copy the text inside the text field */
  navigator.clipboard.writeText(copyText.value)
}

export const useInstanceInterval = (fn: Fn, interval?: MaybeRef<number> | undefined, options?: IntervalFnOptions | undefined) => {
  const intervalObject = useIntervalFn(fn, interval, options)

  onBeforeUnmount(() => {
    intervalObject.pause()
  })

  return intervalObject
}
