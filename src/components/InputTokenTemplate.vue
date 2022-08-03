<script setup lang="ts">
const props = defineProps<{
  modelValue?: string | number
  noInputFilter?: boolean
  inputDisabled?: boolean
  inputLoading?: boolean
  inputReadonly?: boolean
  maxButton?: boolean
  bottom?: boolean
  right?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'click:max'])

function onInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  if (props.noInputFilter) {
    emit('update:modelValue', value)
  } else {
    const num = Number(value)
    if (!Number.isNaN(num)) emit('update:modelValue', String(num))
  }
}

const inputElem = templateRef('input')
defineExpose({ inputElem })
</script>

<template>
  <div class="root space-y-3">
    <div class="space-top flex items-center space-x-2">
      <div class="flex-1">
        <input
          ref="input"
          v-bind="$attrs"
          :value="modelValue"
          :disabled="inputDisabled || inputLoading"
          :readonly="inputReadonly"
          placeholder="0"
          @input="onInput"
        >
      </div>

      <KlayLoader
        v-if="inputLoading"
        color="gray"
        size="24"
      />

      <KlayButton
        v-if="maxButton"
        size="xs"
        type="primary"
        @click="emit('click:max')"
      >
        MAX
      </KlayButton>

      <slot name="top-right" />
    </div>

    <div
      v-if="bottom"
      class="space-bottom flex items-center"
    >
      <slot name="bottom-left" />

      <div class="flex-1" />

      <slot name="bottom-right" />
    </div>

    <div
      v-if="right"
      class="space-right"
    >
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/vars';

.root {
  background: $gray6;
  padding: 16px 16px;
  border-radius: 8px;
  display: grid;
  grid-template-columns: 1fr auto;
}

.space-top {
  grid-column: 1;
  grid-row: 1;
}

.space-bottom {
  grid-column: 1;
  grid-row: 2;
}

.space-right {
  grid-column: 2;
  grid-row: 1 / 2;
}

input {
  font-style: normal;
  font-weight: 600;
  font-size: 30px;
  line-height: 130%;
  color: $dark2;
  background: transparent;
  border: none;
  min-width: 0;
  width: 100%;

  &:focus {
    outline: none;
  }
}
</style>
