<script setup lang="ts" name="KlaySlider">
import { useStore } from './composables/store'
import { useClasses } from './composables/classes'
import { useStyles } from './composables/styles'
import { useObserver } from './composables/observer'
import { useHandlers } from './composables/handlers'
import { props as propsObject } from './props'
import { Event } from './types'

const props = defineProps(propsObject)
const emit = defineEmits(Object.values(Event))
const store = useStore(props)
const { slider, thumb } = store
const classes = useClasses(store, props)
const styles = useStyles(store, props)
useObserver(store, props)
const {
  handleClick,
  // handleInput,
} = useHandlers(store, props, emit)
const vBem = useBemClass()
</script>

<template>
  <div
    ref="slider"
    v-bem="classes.root"
    :disabled="disabled || undefined"
    @touchstart="!disabled ? handleClick($event) : null"
    @mousedown="!disabled ? handleClick($event) : null"
  >
    <div v-bem="classes.wrapper">
      <div
        v-bem="classes.line"
        :style="styles.line"
      />
    </div>
    <div
      ref="thumb"
      v-bem="classes.thumb"
      :style="styles.thumb"
    />
  </div>
</template>

<style lang="sass">
@use '@/styles/vars'

.klay-slider
  position: relative
  display: flex
  align-items: center
  height: 28px
  margin: 4px 0
  cursor: pointer
  &__wrapper
    position: relative
    overflow: hidden
    height: 4px
    width: 100%
    border-radius: 2px
    background: vars.$gray6
  &__line
    position: absolute
    height: 100%
    width: 100%
    right: 100%
    background: vars.$gray6
  &__thumb
    position: absolute
    height: 20px
    width: 20px
    &::after
      content: ''
      position: absolute
      width: 100%
      height: 100%
      border-radius: 50%
      background: white
      box-shadow: 0px 2px 6px 0px rgba(0, 0, 0, 0.15)
      transition: transform 300ms
  &__line, &__thumb
    transition: transform 80ms
  &:hover &__thumb:after
    transform: scale(1.1)
</style>
