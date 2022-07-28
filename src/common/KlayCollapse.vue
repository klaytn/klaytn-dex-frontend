<script setup lang="ts">
import { SCollapseTransition } from '@soramitsu-ui/ui'
import { KlayIconCollapseArrow } from '~klay-icons'

defineProps<{
  alwaysOpened?: boolean
}>()

const isOpen = ref(false)
</script>

<template>
  <div class="collapse px-4">
    <div
      class="flex items-center cursor-pointer py-2"
      @click="isOpen = !isOpen"
    >
      <slot name="head" />
      <div
        v-if="!alwaysOpened"
        class="ml-auto"
        :class="{
          'chevron--opened rotate-180': isOpen,
        }"
      >
        <KlayIconCollapseArrow />
      </div>
    </div>

    <SCollapseTransition>
      <div v-if="isOpen || alwaysOpened">
        <div class="mb-4">
          <slot name="main" />
        </div>
      </div>
    </SCollapseTransition>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/vars';

.collapse {
  border: 1px solid $gray6;
  border-radius: 8px;
  background: $white;
}

.chevron--opened {
  color: $blue;
}
</style>
