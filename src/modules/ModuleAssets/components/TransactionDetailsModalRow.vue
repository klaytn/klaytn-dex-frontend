<script setup lang="ts">
defineProps<{
  twoLine?: boolean
}>()
</script>

<template>
  <div class="flex">
    <div class="title flex-1">
      <slot name="title" />
    </div>

    <template v-if="twoLine">
      <div class="flex flex-col space-y-2">
        <div class="value-top">
          <slot name="value-top" />
        </div>
        <div class="value-sub flex justify-end">
          <slot name="value-sub" />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="value-top">
        <slot name="value" />
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/vars';

.title {
  font-weight: 500;
  font-size: 14px;
  line-height: 1em;
}

.value-top {
  font-weight: 600;
  font-size: 14px;
}

.value-sub {
  font-weight: 500;
  font-size: 12px;
  color: vars.$gray2;
}
</style>
