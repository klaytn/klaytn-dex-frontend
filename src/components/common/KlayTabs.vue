<script setup lang="ts" name="KlayTabs">
import { Tab } from '@/types'

const vBem = useBemClass()

const props = withDefaults(
  defineProps<{
    modelValue: Tab['id']
    tabs: Tab[]
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)
const { tabs } = toRefs(props)
const emit = defineEmits(['update:modelValue'])
const model = useVModel(props, 'modelValue', emit)
</script>

<template>
  <div v-bem="{ disabled }">
    <div
      v-for="tab in tabs"
      :key="tab.id"
      v-bem="['tab', { active: model === tab.id }]"
      @click="model = tab.id"
    >
      {{ tab.label }}
    </div>
  </div>
</template>

<style lang="sass">
@use '@/styles/vars'

.klay-tabs
  background: vars.$gray6
  border-radius: 10px
  padding: 4px
  display: flex
  justify-content: space-between
  position: relative
  &--disabled
    pointer-events: none
  &__tab
    padding: 6px 12px
    background: transparent
    font-style: normal
    font-weight: 700
    font-size: 14px
    line-height: 21px
    white-space: nowrap
    text-overflow: ellipsis
    overflow: hidden
    z-index: 2
    border-radius: 10px
    cursor: pointer
    &+&
      margin-left: 8px
    &--active
      background-color: vars.$blue
      color: vars.$white
  &--disabled &__tab
    &, &--active
      background-color: transparent
      color: vars.$gray3
</style>
