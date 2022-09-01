import { Orientation } from '../types'
import type { Props } from '../types'
import type { Store } from './store'

export function useObserver(store: Store, props: Props) {
  const { slider, sliderSize, thumb, thumbSize } = store
  const { orientation } = toRefs(props)

  const observer = new ResizeObserver((entries) => {
    sliderSize.value = {
      length: orientation.value === Orientation.Horizontal ? slider.value.clientWidth : slider.value.clientHeight,
      thickness: orientation.value === Orientation.Horizontal ? slider.value.clientHeight : slider.value.clientWidth,
    }
    thumbSize.value = thumb.value.clientWidth

    if (slider.value !== entries[0].target && slider.value instanceof Element) {
      observer.unobserve(entries[0].target)
      observer.observe(slider.value)
    }
    if (thumb.value !== entries[0].target && thumb.value instanceof Element) {
      observer.unobserve(entries[0].target)
      observer.observe(thumb.value)
    }
  })

  onMounted(() => {
    observer.observe(slider.value)
    observer.observe(thumb.value)
  })

  return observer
}
