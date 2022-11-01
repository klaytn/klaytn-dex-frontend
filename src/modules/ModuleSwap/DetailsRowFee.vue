<script setup lang="ts">
import cssRows from '../ModuleTradeShared/rows.module.scss.types'
import { FeeItem } from './utils'
import FeeArray from './FeeArray.vue'
import { KlayIconImportant } from '~klay-icons'
import { SPopover } from '@soramitsu-ui/ui'
import { POOL_COMMISSION } from '@/core'

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
            class="info-popper space-y-4 p-4 bg-white shadow-lg rounded-lg max-w-90"
          >
            <p>
              Swap trade will incur a fee and the fees shown are the list of the fees incurred by pools utilized for
              token swap. Generated fees are used to reward liquidity providers.
            </p>

            <p>Fee amount is {{ POOL_COMMISSION.toFormat() }} of trade amount.</p>

            <p>For example:</p>

            <p>
              Fee of 1 Klay > 2 EA = 0.003 Klay
              <br>
              Fee of 1 Klay > 2 EA > 3 PL = 0.003 Klay + 0.006 EA
            </p>
          </div>
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
  color: vars.$gray2;
  font-size: 12px;
  font-weight: 500;
  line-height: 180%;
}
</style>
