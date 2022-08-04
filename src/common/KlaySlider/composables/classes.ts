import { Orientation } from '../types'
import type { Props } from '../types'
import type { Store } from './store'

export function useClasses(store: Store, props: Props) {
  const rootBemModifiers = computed(() => ({
    horizontal: props.orientation === Orientation.Horizontal,
    vertical: props.orientation === Orientation.Vertical,
  }))

  return {
    root: ['', rootBemModifiers.value],
    wrapper: 'wrapper',
    line: 'line',
    thumb: 'thumb',
  }
}
