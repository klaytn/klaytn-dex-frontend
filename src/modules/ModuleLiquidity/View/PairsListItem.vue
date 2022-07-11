LiquidityPairsPositionItem
<script setup lang="ts">
import { roundTo } from 'round-to'
import { toRefs } from '@vueuse/core'
import { LiquidityPairsPosition, LiquidityPairValueRaw } from '@/store/liquidity'
import invariant from 'tiny-invariant'
import BigNumber from 'bignumber.js'

const props = defineProps<{
  data: LiquidityPairsPosition
}>()

const { liquidityTokenBalance, pair } = $(toRefs(toRef(props, 'data')))
const { name, reserve0, reserve1, reserveKLAY, reserveUSD } = $(toRefs($$(pair)))

const tokensStore = useTokensStore()

const useTokenAnyway = (which: 'token0' | 'token1') =>
  computed(() => {
    const token = tokensStore.tryFindToken(pair[which].id)
    invariant(token)
    return token
  })
const tokensResolved = reactive({
  token0: useTokenAnyway('token0'),
  token1: useTokenAnyway('token1'),
})

function getTokenSymbol(which: 'token0' | 'token1'): string {
  return tokensResolved[which].symbol[0]
}

function formatValueRaw(value: LiquidityPairValueRaw) {
  return roundTo(Number(value), 5)
}

function formatPercent(v1: LiquidityPairValueRaw, v2: LiquidityPairValueRaw) {
  if (v1 === '0') return '0'
  const percent = new BigNumber(v1).dividedToIntegerBy(100)
  return `${new BigNumber(v2).dividedBy(percent).toFixed(2)}%`
}
</script>

<template>
  <KlayCollapse>
    <template #head>
      <div class="pair--head">
        <div class="pair--icon-f">
          <KlayIcon
            :char="getTokenSymbol('token0')"
            name="empty-token"
          />
        </div>
        <div class="pair--icon-s">
          <KlayIcon
            :char="getTokenSymbol('token1')"
            name="empty-token"
          />
        </div>

        <span class="pair--names"> {{ name }} </span>
        <span class="pair--rate">
          <!-- {{ formatValueRaw(p.totalSupply) }} -->
          <span class="pair--rate-gray">(${{ formatValueRaw(reserveUSD) }}) </span>
        </span>
      </div>
    </template>
    <template #main>
      <div class="pair--main">
        <div class="pair--info">
          <div class="pair--row">
            <span>Pooled {{ tokensResolved.token0.name }}</span>
            <span>
              {{ formatValueRaw(reserve0) }}
            </span>
          </div>
          <div class="pair--row">
            <span>Pooled {{ tokensResolved.token1.name }}</span>
            <span>
              {{ formatValueRaw(reserve1) }}
            </span>
          </div>
          <div class="pair--row">
            <span>Your pool tokens:</span>
            <span>
              {{ formatValueRaw(liquidityTokenBalance) }}
            </span>
          </div>
          <div class="pair--row">
            <span>Your pool share:</span>
            <span>
              {{ formatPercent(reserveKLAY, liquidityTokenBalance) }}
            </span>
          </div>
        </div>

        <div class="pair--links">
          <!-- TODO -->
          <!-- <RouterLink to="/liquidity/add">
            Add
          </RouterLink>
          <RouterLink :to="`/liquidity/remove/${p.address}`">
            Remove
          </RouterLink>
          <a
            href="#"
            class="deposit"
          >Deposit</a> -->
        </div>
      </div>
    </template>
  </KlayCollapse>
</template>
