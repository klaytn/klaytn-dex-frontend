<script setup lang="ts">
import IconOk from '~icons/material-symbols/check-circle-rounded'
import IconErr from '~icons/material-symbols/error-rounded'
import IconClose from '~icons/material-symbols/close-rounded'

defineProps<{
  type: 'err' | 'ok'
  title?: string
  description?: string
  error?: unknown
  action?: string
}>()

const emit = defineEmits(['click:close', 'click:action'])
</script>

<template>
  <div
    class="toast p-4 space-y-4"
    :data-type="type"
  >
    <div class="flex items-center space-x-2">
      <component
        :is="type === 'ok' ? IconOk : IconErr"
        class="icon"
      />

      <span class="toast-title flex-1">
        <slot name="title">
          <template v-if="title">{{ title }}</template>
          <template v-else-if="type === 'ok'">Success</template>
          <template v-else>Error</template>
        </slot>
      </span>

      <KlayButton
        data-testid="btn-close"
        type="action"
        size="xs"
        rounded
        @click="emit('click:close')"
      >
        <template #icon>
          <IconClose />
        </template>
      </KlayButton>
    </div>

    <div
      v-if="description || $slots.description"
      class="toast-desc"
    >
      <slot name="description">
        {{ description }}
      </slot>
    </div>

    <template v-if="type === 'err' && error">
      <!-- <div class="klay-divider" /> -->

      <div class="toast-error">
        <code>
          {{ error }}
        </code>
      </div>
    </template>

    <div v-if="action || $slots.action">
      <KlayButton
        size="sm"
        @click="emit('click:action')"
      >
        <slot name="action">
          {{ action }}
        </slot>
      </KlayButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.toast {
  background: white;
  box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  max-width: 260px;
  overflow: hidden;
  max-height: 400px;

  &[data-type='ok'] .icon {
    color: vars.$green;
  }

  &[data-type='err'] .icon {
    color: vars.$red;
  }
}

.toast-title {
  font: {
    size: 16px;
    weight: 700;
  }
  line-height: 1.2rem;
}

.toast-error {
  code {
    font-family: monospace !important;
  }
  font-size: 12px;
  color: vars.$gray2;
}

.toast-desc {
  font-size: 12px;
  color: vars.$gray2;
  font-weight: 500;
  line-height: 130%;
}
</style>
