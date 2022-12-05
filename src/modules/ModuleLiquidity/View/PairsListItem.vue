<script setup lang="ts">
import { toRefs } from '@vueuse/core'
import { LiquidityPairsPosition } from '../query.liquidity-pairs'
import BigNumber from 'bignumber.js'
import cssRows from '../../ModuleTradeShared/rows.module.scss.types'

const cssRowMd = cssRows.rowMd

const props = defineProps<{
  data: LiquidityPairsPosition
  alwaysOpened?: boolean
}>()

const emit = defineEmits(['click:add', 'click:remove', 'click:deposit'])

const { liquidityTokenBalance, pair } = toRefs(toRef(props, 'data'))
const pairReactive = toReactive(pair)

/**
 * https://github.com/soramitsu/klaytn-dex-frontend/pull/150#discussion_r998063300
 */
const balanceUsd = computed(() => {
  const { reserveUSD, totalSupply } = pairReactive
  const value = new BigNumber(reserveUSD).dividedBy(totalSupply).multipliedBy(liquidityTokenBalance.value)
  return value.isNaN() ? null : value
})

const poolSharePercent = computed(() => new BigNumber(liquidityTokenBalance.value).dividedBy(pairReactive.totalSupply))
</script>

<template>
  <KlayCollapse v-bind="{ alwaysOpened }">
    <template #head>
      <div class="head flex flex-wrap items-center gap-2">
        <KlaySymbolsPair
          :token-a="pair.token0.symbol"
          :token-b="pair.token1.symbol"
        />
        <span>{{ pair.name }}</span>
        <div class="flex gap-2">
          <CurrencyFormatTruncate
            :amount="liquidityTokenBalance"
            :decimals="5"
            data-testid="pair-list-item-header-value"
          />
          <span
            v-if="balanceUsd"
            class="reserve-usd"
            data-testid="pair-list-item-header-value-usd"
          >(<CurrencyFormatTruncate
            :amount="balanceUsd"
            usd
          />)</span>
        </div>
      </div>
    </template>

    <template #main>
      <div class="space-y-4 mt-2">
        <div :class="cssRowMd">
          <span>Pooled {{ pair.token0.symbol }}</span>
          <span>
            <CurrencyFormatTruncate :amount="pair.reserve0" />
          </span>
        </div>
        <div :class="cssRowMd">
          <span>Pooled {{ pair.token1.symbol }}</span>
          <span>
            <CurrencyFormatTruncate :amount="pair.reserve1" />
          </span>
        </div>
        <div :class="cssRowMd">
          <span>Your pool tokens:</span>
          <span>
            <CurrencyFormatTruncate :amount="liquidityTokenBalance" />
          </span>
        </div>
        <div :class="cssRowMd">
          <span>Your pool share:</span>
          <span>
            <CurrencyFormat
              :amount="poolSharePercent"
              percent
              decimals="7"
            />
          </span>
        </div>

        <div class="grid grid-cols-3 gap-4 mt-4">
          <KlayButton @click="emit('click:add')">
            Add
          </KlayButton>
          <KlayButton @click="emit('click:remove')">
            Remove
          </KlayButton>
          <KlayButton
            type="primary"
            @click="emit('click:deposit')"
          >
            Deposit
          </KlayButton>
        </div>
      </div>
    </template>
  </KlayCollapse>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.head {
  font-size: 14px;
  font-weight: 600;
  color: vars.$dark2;
  user-select: none;
}

.reserve-usd {
  color: vars.$gray2;
  font-weight: 500;
}
</style>
