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
      class="flex items-center cursor-pointer py-3 space-x-4"
      @click="isOpen = !isOpen"
    >
      <div class="head flex-1">
        <slot
          name="head"
          v-bind="{ isOpen }"
        />
      </div>
      <div
        v-if="!alwaysOpened"
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
@use '@/styles/vars';

.collapse {
  border: 1px solid vars.$gray6;
  border-radius: 8px;
  background: vars.$white;
}

.head {
  font-size: 14px;
  font-weight: 600;
}

.chevron--opened {
  color: vars.$blue;
}
</style>
