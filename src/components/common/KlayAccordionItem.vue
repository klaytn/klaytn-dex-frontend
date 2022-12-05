<script setup lang="ts" name="KlayAccordionItem">
import { SAccordionItem } from '@soramitsu-ui/ui'
import { KlayIconChevron } from '~klay-icons'

const vBem = useBemClass()

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    title?: string
    subtitle?: string
    name?: string
    type?: 'default' | 'light'
  }>(),
  {
    modelValue: false,
    title: '',
    subtitle: '',
    name: '',
    type: 'default',
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
    v-bem="{ type }"
  >
    <template #title>
      <slot name="title" />
      <div v-bem="'chevron-wrapper'">
        <KlayIconChevron v-bem="'chevron'" />
      </div>
    </template>
    <slot />
  </SAccordionItem>
</template>

<style lang="sass">
@use '@/styles/vars'

.klay-accordion-item
  &.s-accordion-item
    position: relative
    border: none
    transition: 250ms ease background-color
    & + &
      margin-top: -2px
    &:not(.s-accordion-item_expanded)::before
      transform: scaleX(0)
    &_expanded .s-accordion-item__trigger
      background: transparent
    &_expanded .s-accordion-item__body-wrapper
      box-shadow: none
      &::before
        background: vars.$gray5
    .s-accordion-item
      &__trigger
        height: auto
        min-height: 80px
      &__head
        position: relative
      &__chevron
        display: none
  &--type--default.s-accordion-item
    border-top: 2px solid vars.$gray6
    border-bottom: 2px solid vars.$gray6
    &::before
      content: ''
      position: absolute
      height: 100%
      width: 4px
      background-color: vars.$blue
      transition: 250ms ease transform
      transform-origin: left
    &_expanded
      background-color: vars.$gray7
    .s-accordion-item
      &__body
        padding: 16px 24px
      &__body-wrapper
        position: relative
        &::before
          content: ''
          position: absolute
          height: 1px
          width: calc(100% - 48px)
          left: 24px
          transition: 250ms ease background-color
  &--type--light.s-accordion-item
    .s-accordion-item
      &__trigger
        padding: 0
      &__body
        padding: 0
  &__chevron
    fill: vars.$gray4
    transition: 250ms ease fill, 250ms ease-in-out transform
    &-wrapper
      position: absolute
      display: flex
      align-items: center
      height: 100%
      right: 0
      top: 0
  .s-accordion-item_expanded &__chevron
    fill: vars.$blue
    transform: rotate(180deg)
</style>
