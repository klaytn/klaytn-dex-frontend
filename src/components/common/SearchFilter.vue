<script lang="ts" setup name="SearchFilter">
import { SPopover } from '@soramitsu-ui/ui'
import { KlayIconSearch, KlayIconSearch_2 } from '~klay-icons'

const vBem = useBemClass()

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits(['update:modelValue'])
const model = useVModel(props, 'modelValue', emit)
</script>

<template>
  <div>
    <KlayTextField
      v-model="model"
      v-bem="'field'"
      class="lt-md:hidden"
      label="Search"
    >
      <template #append>
        <KlayIconSearch v-bem="'field-icon'" />
      </template>
    </KlayTextField>

    <SPopover
      placement="bottom-end"
      distance="8"
      hide-delay="400"
    >
      <template #trigger>
        <span>
          <KlayIconSearch_2
            v-bem="'trigger'"
            class="md:hidden"
          />
        </span>
      </template>

      <template #popper="{ show }">
        <div
          v-if="show"
          class="popper bg-white rounded-lg shadow-md p-4 z-10 space-y-4 flex flex-col"
        >
          <KlayTextField
            v-model="model"
            v-bem="'field'"
            class="md:hidden"
            label="Search"
          >
            <template #append>
              <KlayIconSearch v-bem="'field-icon'" />
            </template>
          </KlayTextField>
        </div>
      </template>
    </SPopover>
  </div>
</template>

<style lang="sass">
@use '@/styles/vars'

.search-filter
  &__trigger:hover
    fill: vars.$blue
  &__field
    width: 225px
    &, .s-text-field__input-wrapper
      height: 40px
    label
      transform: translateY(0)
      top: 12px
      left: 38px
      line-height: 16px
      color: vars.$gray2
    &:focus-within label, &:not(.s-text-field_empty) label
      transform: translateY(0)
      opacity: 0
    input
      padding: 12px 12px 12px 38px
      line-height: 16px
    &-icon
      position: absolute
      left: 12px
      stroke: vars.$gray2
</style>
