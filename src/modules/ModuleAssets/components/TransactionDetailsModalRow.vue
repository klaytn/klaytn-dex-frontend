<script setup lang="ts">
defineProps<{
  twoLine?: boolean
}>()
</script>

<template>
  <div class="flex gap-8">
    <div class="text-sm font-medium">
      <slot name="title" />
    </div>

    <template v-if="twoLine">
      <div class="flex flex-col space-y-2 flex-1 min-w-0">
        <div :class="$style.valueTop">
          <slot name="value-top" />
        </div>
        <div :class="$style.valueSub">
          <slot name="value-sub" />
        </div>
      </div>
    </template>

    <template v-else>
      <div
        :class="$style.valueTop"
        class="flex-1 min-w-0"
      >
        <slot name="value" />
      </div>
    </template>
  </div>
</template>

<style lang="scss" module>
@use '@/styles/vars';

.value-top {
  font-weight: 600;
  font-size: 14px;
  text-align: right;
}

.value-sub {
  font-weight: 500;
  font-size: 12px;
  color: vars.$gray2;
  text-align: right;
}
</style>
