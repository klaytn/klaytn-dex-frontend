<script setup lang="ts">
import cssRows from '../ModuleTradeShared/rows.module.scss.types'
import { FeeItem } from './utils'
import FeeArray from './FeeArray.vue'
import { KlayIconImportant } from '~klay-icons'
import { SPopover } from '@soramitsu-ui/ui'

defineProps<{
  data: FeeItem[]
}>()
</script>

<template>
  <div
    :class="[cssRows.rowSm, cssRows.rowSmDimmed]"
    class="!items-start"
  >
    <span>Fee
      <SPopover distance="8">
        <template #trigger>
          <span><KlayIconImportant class="inline-block info-icon" /></span>
        </template>
        <template #popper="{ show }">
          <div
            v-if="show"
            class="info-popper p-4 bg-white shadow-lg rounded-lg"
          >TODO</div>
        </template>
      </SPopover>
    </span>
    <FeeArray :data="data" />
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.info-icon {
  color: vars.$gray4;
  font-size: 12px;
  cursor: help;
}

.info-popper {
  // TODO
}
</style>
