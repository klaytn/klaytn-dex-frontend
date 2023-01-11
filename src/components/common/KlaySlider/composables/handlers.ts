/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { type Emit, Event, Orientation, type Props } from '../types'
import type { Store } from './store'

export function useHandlers(store: Store, props: Props, emit: Emit) {
  const previousValue = ref(props.modelValue)

  function formatValue(value: number) {
    return Number(value.toFixed(props.discrete ? 0 : 2))
  }

  function calcValue(mouseX: number, mouseY: number): number {
    const rect = store.slider.value.getBoundingClientRect()
    let value = 0

    if (props.orientation === Orientation.Horizontal) value = (mouseX - rect.x) / store.pixelsPerStep.value
    else value = (rect.y + rect.height - mouseY) / store.pixelsPerStep.value

    value = Math.min(store.sliderRange.value, Math.max(value, 0))

    previousValue.value = value

    return value
  }

  function handleDragging(event: MouseEvent | TouchEvent) {
    let tap
    if (event.type === 'mousemove') {
      event = <MouseEvent>event
      tap = event
    } else {
      event = <TouchEvent>event
      if (event.touches.length > 1) return
      tap = event.touches[0]
    }

    if (store.dragging.value) {
      const value = calcValue(tap.pageX - window.scrollX, tap.pageY - window.scrollY)
      emit(Event.UpdateModelValue, formatValue(value))

      // emit(Event.Dragging, store.formattedSliderValue.value, tap)
      // emit(Event.Dragging, props.modelValue, tap)
    }
  }

  function handleRelease(event: MouseEvent | TouchEvent) {
    if (store.dragging.value) store.dragging.value = false

    if (event.type === 'mouseup') {
      window.removeEventListener('mouseup', handleRelease)
      window.removeEventListener('mousemove', handleDragging)
    } else {
      window.removeEventListener('touchend', handleRelease)
      window.removeEventListener('touchmove', handleDragging)
    }

    emit(Event.DragEnd, props.modelValue, event)
  }

  function handleClick(event: MouseEvent | TouchEvent) {
    event.preventDefault()

    store.dragging.value = true
    emit(Event.DragStart, props.modelValue, event)

    if (event.type === 'touchstart') {
      event = <TouchEvent>event
      if (event.touches.length > 1) return
      const t = event.touches[0]

      const value = calcValue(t.pageX - window.scrollX, t.pageY - window.scrollY)
      emit(Event.UpdateModelValue, formatValue(value))

      window.addEventListener('touchend', handleRelease)

      window.addEventListener('touchmove', handleDragging)
    } else {
      event = <MouseEvent>event

      const value = calcValue(event.pageX - window.scrollX, event.pageY - window.scrollY)
      emit(Event.UpdateModelValue, formatValue(value))

      window.addEventListener('mouseup', handleRelease)

      window.addEventListener('mousemove', handleDragging)
    }
  }

  function handleInput(value: string) {
    const parsedValue = Number(value)
    emit(Event.UpdateModelValue, parsedValue)
  }

  return {
    handleClick,
    handleInput,
  }
}
