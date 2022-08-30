import type { ExtractPropTypes } from 'vue'

import type { props } from './props'

export enum Orientation {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export enum Event {
  UpdateModelValue = 'update:model-value',
  DragStart = 'drag-start',
  DragEnd = 'drag-end',
  Dragging = 'dragging',
}

export type Emit = (event: Event, ...args: any[]) => void

export type Props = Readonly<ExtractPropTypes<typeof props>>
