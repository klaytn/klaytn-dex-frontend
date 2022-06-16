<script>
export default {
  name: 'KlayModal',
  props: {
    label: {
      type: String,
      default: '',
    },
    width: {
      type: String,
      default: '300',
    },
  },
  emits: ['close'],
}
</script>

<template>
  <div class="klay-modal">
    <div class="klay-modal--close-layer" @click="$emit('close')" />
    <div
      class="klay-modal--body"
      :style="{
        width: `${width}px`,
      }"
    >
      <div class="head">
        <h3>{{ label || "" }}</h3>
        <button type="button" class="close" @click="$emit('close')">
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

  &--close-layer {
    position: absolute;
    background: rgba(68, 73, 85, 0.3);
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    z-index: 998;
    cursor: pointer;
  }

  &--body {
    text-align: left;
    background: $white;
    border-radius: 20px;
    z-index: 999;
    max-height: 90vh;
    overflow: auto;

    & .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 20px 17px;
      padding-bottom: 0;

      & .close {
        cursor: pointer;
      }

      & h3 {
        font-style: normal;
        font-weight: 700;
        font-size: 18px;
        line-height: 150%;
      }
    }
  }
}
</style>
