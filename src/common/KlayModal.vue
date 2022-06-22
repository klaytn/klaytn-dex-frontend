<script setup lang="ts" name="KlayModal">
const { label = '', width = '300' } = defineProps<{
  label: string
  width: string
}>()

defineEmits(['close'])

const vBem = useBemClass()
</script>

<template>
  <div v-bem>
    <div v-bem="'close-layer'" @click="$emit('close')" />
    <div
      v-bem="'body'"
      :style="{
        width: `${width}px`,
      }"
    >
      <div v-bem="'head'">
        <h3>{{ label || "" }}</h3>
        <button v-bem="'close'" type="button" @click="$emit('close')">
          <KlayIcon name="close" />
        </button>
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.klay-modal {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;

  &__close-layer {
    position: absolute;
    background: rgba(68, 73, 85, 0.3);
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    z-index: 998;
    cursor: pointer;
  }

  &__body {
    text-align: left;
    background: $white;
    border-radius: 20px;
    z-index: 999;
    max-height: 90vh;
    overflow: auto;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 20px 17px;
    padding-bottom: 0;
    & h3 {
      font-style: normal;
      font-weight: 700;
      font-size: 18px;
      line-height: 150%;
    }
  }

  &__close {
    cursor: pointer;
  }
}
</style>
