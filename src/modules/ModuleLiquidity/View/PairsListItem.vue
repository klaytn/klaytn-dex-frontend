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

const formattedPoolShare = useFormattedPercent(
  computed(() => new BigNumber(liquidityTokenBalance.value).dividedBy(pairReactive.totalSupply).toNumber()),
  7,
)
</script>

<template>
  <KlayCollapse v-bind="{ alwaysOpened }">
    <template #head>
      <div class="head flex items-center space-x-2">
        <KlaySymbolsPair
          :token-a="pair.token0.symbol"
          :token-b="pair.token1.symbol"
        />
        <span>{{ pair.name }}</span>
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
    </template>

    <template #main>
      <div class="space-y-4 mt-2">
        <div :class="cssRowMd">
          <span>Pooled {{ pair.token0.name }}</span>
          <span>
            <CurrencyFormat
              :amount="pair.reserve0"
              :decimals="5"
            />
          </span>
        </div>
        <div :class="cssRowMd">
          <span>Pooled {{ pair.token1.name }}</span>
          <span>
            <CurrencyFormat
              :amount="pair.reserve1"
              :decimals="5"
            />
          </span>
        </div>
        <div :class="cssRowMd">
          <span>Your pool tokens:</span>
          <span>
            <CurrencyFormat
              :amount="liquidityTokenBalance"
              :decimals="5"
            />
          </span>
        </div>
        <div :class="cssRowMd">
          <span>Your pool share:</span>
          <span>
            {{ formattedPoolShare }}
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
@import '@/styles/vars';

.head {
  font-size: 14px;
  font-weight: 600;
  color: $dark2;
  user-select: none;
}

.reserve-usd {
  color: $gray2;
  font-weight: 500;
}
</style>
