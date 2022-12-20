<script lang="ts" setup name="SortingFilter">
import { SPopover } from '@soramitsu-ui/ui'
import { KlayIconCheckbox, KlayIconSorting } from '~klay-icons'

const { t } = useI18n()
const vBem = useBemClass()

const props = defineProps<{
  modelValue: string
  options: { value: string; label: string }[]
}>()

const emit = defineEmits(['update:modelValue'])
const model = useVModel(props, 'modelValue', emit)
</script>

<template>
  <div>
    <div class="lt-md:hidden ml-4 md:flex items-center">
      <span v-bem="'label'">
        {{ t('SortingAndSearchFilter.sortBy') }}
      </span>
      <KlaySelect
        v-model="model"
        v-bem="'select'"
        class="ml-2"
        :options="options"
        size="lg"
      />
    </div>
    <SPopover
      placement="bottom-end"
      distance="8"
      hide-delay="400"
    >
      <template #trigger>
        <span>
          <KlayIconSorting
            v-bem="'trigger'"
            class="md:hidden"
          />
        </span>
      </template>

      <!-- <template #popper="{ show }">
        <div
          v-if="show"
          class="popper bg-white rounded-lg shadow-md p-4 z-10 space-y-4 flex flex-col"
        >
          <KlaySelect
            v-model="model"
            v-bem="'select'"
            :options="options"
            size="lg"
          />
        </div>
      </template> -->

      <template #popper="{ show }">
        <div
          v-if="show"
          class="flex flex-col bg-white z-10 rounded-lg shadow-lg w-160px"
        >
          <div
            class="text-sm px-4 py-2"
            :class="$style.header"
          >
            {{ t('SortingAndSearchFilter.sortBy') }}:
          </div>
          <div
            v-for="item in options"
            :key="item.value"
            :class="$style.item"
            class="flex items-center gap-2 text-sm font-medium px-4 py-2 cursor-pointer"
            @click="model = item.value"
          >
            <KlayIconCheckbox
              v-if="item.value === model"
              :class="$style.checkboxIcon"
            />
            <span> {{ item.label }} </span>
          </div>
        </div>
      </template>
    </SPopover>
  </div>
</template>

<style lang="scss" module>
@use '@/styles/vars';

.header {
  border-bottom: 1px solid vars.$gray5;
}

.item {
  color: vars.$dark;
  transition: 250ms ease background-color;
  &:hover {
    background-color: vars.$gray7;
  }
}

.checkbox-icon {
  fill: vars.$blue;
}
</style>

<style lang="sass">
@use '@/styles/vars'

.sorting-filter
  &__trigger:hover
    fill: vars.$blue
  &__label
    margin-left: auto
    font-size: 14px
    font-weight: 400
    color: vars.$gray2
  &__select
    div:last-child
      z-index: 100
    .s-radio-atom_checked
      border-color: vars.$blue !important
      &:before
        background-color: vars.$blue !important
    .s-select-input__label
      display: none
      + span
        font-weight: 500
        font-size: 14px
    &, .s-select-dropdown
      width: 160px
</style>
