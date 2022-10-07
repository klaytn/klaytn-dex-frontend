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
        <span>
          <CurrencyFormat
            :amount="pair.reserveKLAY"
            :decimals="3"
          />
        </span>
        <span class="reserve-usd">(<CurrencyFormat
          :amount="pair.reserveUSD"
          :decimals="2"
          symbol="$"
          symbol-delimiter=""
          symbol-position="left"
        />)</span>
      </div>
    </template>

    <template #main>
      <div class="space-y-4 pt-4">
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
