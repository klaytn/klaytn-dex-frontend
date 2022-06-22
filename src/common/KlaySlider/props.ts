import type { PropType } from 'vue'

import { Orientation } from './types'

export const props = {
  /**
   * v-model for two-way data binding
   *
   * @default 0
   */
  modelValue: {
    type: Number as PropType<number>,
    default: 0,
  },
  /**
   * Minimum value
   *
   * @default 0
   */
  min: {
    type: Number as PropType<number>,
    default: 0,
  },
  /**
   * Maximum value
   *
   * @default 100
   */
  max: {
    type: Number as PropType<number>,
    default: 100,
  },
  /**
   * Slider orientation
   *
   * @default Orientation.Horizontal
   */
  orientation: {
    type: String as PropType<Orientation>,
    default: Orientation.Horizontal,
  },
  /**
   * Specifies whether slider value should be discrete
   *
   * @default true
   */
  discrete: {
    type: Boolean as PropType<boolean>,
    default: true,
  },
  /**
   * Length of discrete step
   *
   * @default 1
   */
  discreteStep: {
    type: Number as PropType<number>,
    default: 1,
  },
  /**
   * Specifies whether there should be points with intermediate values
   *
   * @default false
   */
  points: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
  /**
   * Length of step between points
   *
   * @default 20
   */
  pointsStep: {
    type: Number as PropType<number>,
    default: 20,
  },
  /**
   * Specifies whether there should be input
   *
   * @default false
   */
  input: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
  /**
   * Specifies whether there should be tooltip with current value
   *
   * @default true
   */
  tooltip: {
    type: Boolean as PropType<boolean>,
    default: true,
  },
  /**
   * Units that will be shown after values
   *
   * @default ''
   */
  units: {
    type: String as PropType<string>,
    default: '',
  },
  /**
   * Specifies whether slider is disabled
   *
   * @default false
   */
  disabled: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
}
