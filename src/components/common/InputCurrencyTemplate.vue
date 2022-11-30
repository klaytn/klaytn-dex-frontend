<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<script setup lang="ts">
withDefaults(
  defineProps<{
    maxButton?: boolean
    maxButtonDisabled?: boolean
    loading?: boolean
    bottom?: boolean
    right?: boolean
    containerClass?: any
    size?: 'md' | 'lg'
  }>(),
  { size: 'md' },
)

const emit = defineEmits(['update:modelValue', 'click:max'])
</script>

<template>
  <div
    class="input-template px-4 grid-cols-[100%]"
    :class="[containerClass, { 'has-right-column': right }]"
    :data-size="size"
  >
    <div class="space-top flex items-center space-x-2 place-self-stretch">
      <div class="input-wrapper flex-1">
        <slot name="input" />
      </div>

      <KlayLoader
        v-if="loading"
        color="gray"
        size="24"
      />

      <KlayButton
        v-if="maxButton"
        :disabled="maxButtonDisabled"
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
      class="space-bottom flex items-center w-full overflow-hidden"
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
@use '@/styles/vars';

.input-template {
  background: vars.$gray6;
  border-radius: 8px;
  display: grid;
  align-content: center;
  column-gap: 16px;

  &[data-size='md'] {
    height: 72px;
  }

  &[data-size='lg'] {
    height: 88px; // "Hug" in Figma
    padding-top: 4px;

    .space-bottom {
      margin-top: 8px;
    }
  }

  &.has-right-column {
    grid-template-columns: minmax(0, 1fr) auto;
  }
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
  grid-row: 1 / 3;
}

.input-wrapper {
  min-width: 0;

  &:deep(input) {
    font-style: normal;
    font-weight: 600;
    font-size: 30px;
    line-height: 1.3rem;
    background: transparent;
    border: none;
    min-width: 0;
    width: 100%;

    &:focus {
      outline: none;
    }
  }
}
</style>
