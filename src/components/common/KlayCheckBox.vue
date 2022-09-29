<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const model = useVModel(props, 'modelValue', emit)
</script>

<template>
  <span class="inline-flex items-center space-x-2">
    <input
      :id="id"
      v-model="model"
      type="checkbox"
    >
    <label :for="id">
      <slot />
    </label>
  </span>
</template>
