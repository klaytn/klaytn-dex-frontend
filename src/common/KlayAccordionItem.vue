<script setup lang="ts" name="KlayAccordionItem">
import { SAccordionItem } from '@soramitsu-ui/ui'

const vBem = useBemClass()

const props = withDefaults(
  defineProps<{
    modelValue: boolean
  }>(),
  {
    modelValue: false,
    title: '',
    subtitle: '',
    name: '',
  },
)

const emit = defineEmits<(event: 'update:modelValue', value: boolean) => void>()

const model = ref(props.modelValue)
watch(
  () => props.modelValue,
  (origin) => {
    model.value = origin
  },
)
watch(model, (dep) => {
  if (dep !== props.modelValue) {
    emit('update:modelValue', dep)
  }
})
</script>

<template>
  <SAccordionItem
    v-model="model"
    v-bem
  >
    <template #title>
      <slot name="title" />
      <div v-bem="'chevron-wrapper'">
        <IconKlayChevron v-bem="'chevron'" />
      </div>
    </template>
    <slot />
  </SAccordionItem>
</template>

<style lang="sass">
@import '@/styles/vars.sass'

.s-accordion-item
  position: relative
  border: none
  border-top: 2px solid $gray6
  border-bottom: 2px solid $gray6
  transition: 250ms ease background-color
  & + &
    margin-top: -2px
  &::before
    content: ''
    position: absolute
    height: 100%
    width: 4px
    background-color: $blue
    transition: 250ms ease transform
    transform-origin: left
  &_expanded
    background-color: $gray7
  &:not(&_expanded)::before
    transform: scaleX(0)
  &_expanded &__trigger
    background: transparent
  &_expanded &__body-wrapper
    box-shadow: none
  &__trigger
    height: 80px
  &__head
    position: relative
  &__body-wrapper
    position: relative
    &::before
      content: ''
      position: absolute
      height: 1px
      width: calc(100% - 48px)
      left: 24px
      transition: 250ms ease background-color
  &__body
    padding: 16px 24px
  &_expanded &__body-wrapper::before
    background: $gray5
  &__chevron
    display: none

.klay-accordion-item
  &__chevron
    fill: $gray4
    transition: 250ms ease fill, 250ms ease-in-out transform
    &-wrapper
      position: absolute
      display: flex
      align-items: center
      height: 100%
      right: 0
      top: 0
  .s-accordion-item_expanded &__chevron
    fill: $blue
    transform: rotate(180deg)
</style>
