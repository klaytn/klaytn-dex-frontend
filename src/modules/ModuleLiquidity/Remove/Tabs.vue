<script setup lang="ts">
import { TABS, Tab } from './const'

const props = defineProps<{ modelValue: Tab }>()
const emit = defineEmits(['update:modelValue'])
const model = useVModel(props, 'modelValue', emit)
</script>

<template>
  <div class="tabs">
    <div
      v-for="tab in TABS"
      :key="tab"
      :class="[
        'tab',
        {
          'tab--active': model === tab,
        },
      ]"
      @click="model = tab"
    >
      {{ tab === 'amount' ? 'Amount' : 'Detailed' }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.tabs {
  max-width: 177px;
  width: 100%;
  background: vars.$gray6;
  border-radius: 10px;
  padding: 4px;
  display: flex;
  justify-content: space-between;
  position: relative;
}

.tab {
  padding: 6px 12px;
  background: transparent;
  font-style: normal;
  font-weight: 700;
  font-size: 14px;
  line-height: 21px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  z-index: 2;
  border-radius: 10px;
  cursor: pointer;

  &--active {
    background: vars.$blue;
    color: vars.$white;
  }
}
</style>
