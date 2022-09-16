<script setup lang="ts">
import { toRefs } from '@vueuse/core'
import { LiquidityPairsPosition } from '../query.liquidity-pairs'
import BigNumber from 'bignumber.js'
import { RouteName } from '@/types'
import cssRows from '../../ModuleTradeShared/rows.module.scss'

const cssRowMd = cssRows.rowMd

const props = defineProps<{
  data: LiquidityPairsPosition
  alwaysOpened?: boolean
}>()

const { liquidityTokenBalance, pair } = $(toRefs(toRef(props, 'data')))
const { name, reserve0, reserve1, reserveKLAY, reserveUSD, totalSupply, token0, token1 } = $(toRefs($$(pair)))

const pairAddrs = computed(() => ({
  tokenA: token0.id,
  tokenB: token1.id,
}))

const formattedPoolShare = useFormattedPercent(
  computed(() => new BigNumber(liquidityTokenBalance).dividedBy(totalSupply).toNumber()),
  7,
)

const router = useRouter()
const addLiquidityStore = useLiquidityAddStore()

function goToAddLiquidity() {
  addLiquidityStore.setBothAddresses(pairAddrs.value)
  router.push({ name: RouteName.LiquidityAdd })
}

const rmLiquidityStore = useLiquidityRmStore()

function goToRemoveLiquidity() {
  rmLiquidityStore.setTokens(pairAddrs.value)
  router.push({ name: RouteName.LiquidityRemove })
}
</script>

<template>
  <KlayCollapse v-bind="{ alwaysOpened }">
    <template #head>
      <div class="head flex items-center space-x-2">
        <KlaySymbolsPair
          :token-a="token0.symbol"
          :token-b="token1.symbol"
        />
        <span>{{ name }}</span>
        <span>
          <CurrencyFormat
            :amount="reserveKLAY"
            :decimals="3"
          />
        </span>
        <span class="reserve-usd">(<CurrencyFormat
          :amount="reserveUSD"
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
          <span>Pooled {{ token0.name }}</span>
          <span>
            <CurrencyFormat
              :amount="reserve0"
              :decimals="5"
            />
          </span>
        </div>
        <div :class="cssRowMd">
          <span>Pooled {{ token1.name }}</span>
          <span>
            <CurrencyFormat
              :amount="reserve1"
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
          <KlayButton @click="goToAddLiquidity()">
            Add
          </KlayButton>
          <KlayButton @click="goToRemoveLiquidity()">
            Remove
          </KlayButton>
          <KlayButton
            type="primary"
            disabled
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
