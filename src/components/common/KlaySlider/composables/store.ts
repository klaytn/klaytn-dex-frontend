import type { ComputedRef, Ref } from 'vue'

import type { Props } from '../types'

export interface Store {
  slider: Ref<HTMLDivElement>
  thumb: Ref<HTMLDivElement>
  sliderSize: Ref<{
    length: number
    thickness: number
  }>
  thumbSize: Ref<number>
  valueWithUnits: ComputedRef<string>
  sliderRange: ComputedRef<number>
  pixelsPerStep: Ref<number>
  valueInPixels: Ref<number>
  dragging: Ref<boolean>
}

export function useStore(props: Props): Store {
  const { modelValue, units, min, max } = toRefs(props)

  const slider = ref(document.createElement('div')) as Ref<HTMLDivElement>

  const thumb = ref(document.createElement('div')) as Ref<HTMLDivElement>

  const valueWithUnits = computed(() => {
    return `${modelValue} ${units}`
  })

  const sliderSize = ref({
    length: 0,
    thickness: 0,
  })

  const thumbSize = ref(0)

  const sliderRange = computed(() => {
    return max.value - min.value
  })

  const pixelsPerStep = computed(() => {
    return sliderSize.value.length / sliderRange.value
  })

  const valueInPixels = computed(() => {
    return pixelsPerStep.value * modelValue.value
  })

  const dragging = ref(false)

  return {
    slider,
    thumb,
    sliderSize,
    thumbSize,
    valueWithUnits,
    sliderRange,
    pixelsPerStep,
    valueInPixels,
    dragging,
  }
}
