<script lang="ts" setup name="SortingFilter">
import { SPopover } from '@soramitsu-ui/ui'
import { KlayIconSorting } from '~klay-icons'

const { t } = useI18n()
const vBem = useBemClass()

const props = defineProps<{
  modelValue: string
  options: { value: string, label: string }[]
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

      <template #popper="{ show }">
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
      </template>
    </SPopover>
  </div>
</template>

<style lang="sass">
@import '@/styles/vars.sass'

.sorting-filter
  &__trigger:hover
    fill: $blue
  &__label
    margin-left: auto
    font-size: 14px
    font-weight: 400
    color: $gray2
  &__select
    div:last-child
      z-index: 100
    .s-radio-atom_checked
      border-color: $blue !important
      &:before
        background-color: $blue !important
    .s-select-input__label
      display: none
      + span
        font-weight: 500
        font-size: 14px
    &, .s-select-dropdown
      width: 160px
</style>
