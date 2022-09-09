<script lang="ts">
const VALUES_PRESET = [0.001, 0.005, 0.01, 0.03]
</script>

<script setup lang="ts">
import CarbonWarningFilled from '~icons/carbon/warning-filled'
import { roundTo } from 'round-to'

const props = withDefaults(
  defineProps<{
    /**
     * 0 <= `modelValue` <= 1
     */
    modelValue: number
    thresholdMayFail?: number
    thresholdMayBeFrontrun?: number
  }>(),
  {
    thresholdMayFail: 0.005,
    thresholdMayBeFrontrun: 0.03,
  },
)

const emit = defineEmits(['update:modelValue'])

const model = useVModel(props, 'modelValue', emit)
const inputModel = computed({
  get: () => model.value * 100,
  set: (v) => {
    model.value = v / 100
  },
})

const valueFormatted = computed(() => {
  return roundTo(model.value * 100, 1) + `%`
})

const warningMayFail = computed(() => props.modelValue < props.thresholdMayFail)
const warningMayBeFrontrun = computed(() => props.modelValue > props.thresholdMayBeFrontrun)
const anyWarning = logicOr(warningMayBeFrontrun, warningMayFail)
</script>

<template>
  <KlayCollapse>
    <template #head="{ isOpen }">
      <div class="flex items-center">
        <div class="slippage-title flex-1">
          Slippage tolerance

          <!-- TODO: info icon with tooltip -->
          <!-- Setting a high slippage tolerance can help transactions succeed,
            but you may not get such a good price. Use with caution. -->
        </div>

        <Transition name="slippage-tolerance-input-header-value-transition">
          <div
            v-show="!isOpen"
            class="header-value"
            data-testid="header-value"
          >
            {{ valueFormatted }}
          </div>
        </Transition>
      </div>
    </template>

    <template #main>
      <div class="space-y-4 pt-2">
        <div class="flex space-x-[10px]">
          <div class="grid grid-cols-4 gap-2 flex-1">
            <KlayButton
              v-for="percent in VALUES_PRESET"
              :key="percent"
              size="sm"
              data-testid="preset-btn"
              @click="model = percent"
            >
              {{ percent * 100 }}%
            </KlayButton>
          </div>

          <input
            v-model="inputModel"
            type="number"
            max="100"
            min="0"
            step="0.1"
          >
        </div>

        <div
          v-if="anyWarning"
          class="flex space-x-2 items-center"
        >
          <CarbonWarningFilled class="warning-icon" />
          <span class="text-xs">
            <template v-if="warningMayFail">Your transaction may fail</template>
            <template v-else-if="warningMayBeFrontrun">Your transaction may be frontrun</template>
          </span>
        </div>
      </div>
    </template>
  </KlayCollapse>
</template>

<style lang="scss" scoped>
input {
  width: 88px;
  text-align: right;
  padding: 0 8px;
  height: 32px;
  border-radius: 8px;
  background: #eceff5;
}

.warning-icon {
  color: #ffb800;
}
</style>

<style lang="scss">
.slippage-tolerance-input-header-value-transition {
  &-enter-active,
  &-leave-active {
    transition: opacity 0.1s ease;
  }
  &-enter-from,
  &-leave-to {
    opacity: 0;
  }
}
</style>
