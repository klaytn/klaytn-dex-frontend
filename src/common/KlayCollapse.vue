<script setup lang="ts">
import { SCollapseTransition } from '@soramitsu-ui/ui'

const isOpen = ref(false)
</script>

<template>
  <div class="collapse">
    <div
      class="collapse--head"
      @click="isOpen = !isOpen"
    >
      <slot name="head" />
      <div
        class="icon-wrap"
        :style="{ transform: `rotate(${isOpen ? 180 : 0}deg)` }"
      >
        <IconKlayCollapseArrow />
      </div>
    </div>

    <SCollapseTransition>
      <div v-if="isOpen">
        <slot name="main" />
      </div>
    </SCollapseTransition>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/vars';

.collapse {
  border: 1px solid $gray6;
  box-sizing: border-box;
  border-radius: 8px;
  padding: 8px 16px;
  background: $white;
  text-align: left;

  &--head {
    width: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  & .icon-wrap {
    margin-left: auto;
    display: flex;
  }
}
</style>
