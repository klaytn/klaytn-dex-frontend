<script setup lang="ts">
const props = defineProps<{
  modelValue?: string
  inputDisabled?: boolean
  inputLoading?: boolean
  inputReadonly?: boolean
  maxButton?: boolean
  bottom?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'click:max'])

const model = useVModel(props, 'modelValue', emit)
</script>

<template>
  <div class="root space-y-3">
    <div class="flex items-center space-x-2">
      <div class="flex-1">
        <input
          v-bind="$attrs"
          v-model="model"
          :disabled="inputDisabled || inputLoading"
          :readonly="inputReadonly"
          placeholder="0"
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
      class="flex items-center"
    >
      <slot name="bottom-left" />

      <div class="flex-1" />

      <slot name="bottom-right" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/vars';

.root {
  background: $gray6;
  padding: 16px 16px;
  border-radius: 8px;
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
