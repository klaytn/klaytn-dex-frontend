import { Orientation } from '../types'
import type { Props } from '../types'
import type { Store } from './store'

export function useStyles(store: Store, props: Props) {
  const { valueInPixels, sliderSize, thumbSize } = store
  const { orientation } = props

  const thumbTranslateRatio = computed(() => {
    if (sliderSize.value.length === 0) return 1

    return (sliderSize.value.length - thumbSize.value) / sliderSize.value.length
  })

  const thumbTranslate = computed(() => {
    return valueInPixels.value * thumbTranslateRatio.value
  })

  const transform = computed(() => {
    return orientation === Orientation.Horizontal
      ? `translateX(${thumbTranslate.value}px)`
      : `translateY(${thumbTranslate.value}px)`
  })

  const classes = computed(() => {
    return {
      root: {},
      wrapper: {},
      line: { transform: transform.value },
      thumb: { transform: transform.value },
    }
  })

  return classes
}
