<script setup lang="ts">
import { TokenAmount } from '@/core'
import { useMinimalTokensApi } from '@/utils/minimal-tokens-api'
import BigNumber from 'bignumber.js'
import { storeToRefs } from 'pinia'
import invariant from 'tiny-invariant'
import { P, match } from 'ts-pattern'
import cssRows from '../ModuleTradeShared/rows.module.scss.types'
import DetailsRowSlippage from './DetailsRowSlippage.vue'
import CurrencyFormatTruncate from '@/components/common/CurrencyFormatTruncate.vue'
import DetailsRowFee from './DetailsRowFee.vue'

const store = useSwapStore()
const { priceImpact, slippageDataParsed, gotAmountsResult, feeArray: fee } = storeToRefs(store)

const { lookupDerivedUsd } = useMinimalTokensApi()

const priceUsd = computed<null | BigNumber>(() =>
  match(gotAmountsResult.value)
    .with(
      {
        amountsResult: { amountIn: P.select('amount') },
        props: { trade: { route: { input: P.select('token') } } },
      },
      ({ amount, token }) => {
        const usdForToken = lookupDerivedUsd(token.address)
        if (!usdForToken) return null
        return amount.decimals(token).multipliedBy(usdForToken)
      },
    )
    .otherwise(() => null),
)

const formattedPriceImpact = computed(() => {
  return priceImpact.value?.toFormat(2, BigNumber.ROUND_UP) ?? null
})

const slippageDataForSure = computed(() => {
  const { value } = slippageDataParsed
  invariant(value)
  return value
})

const CurrencyInTheNote = ({ amount }: { amount: TokenAmount }) =>
  h(CurrencyFormatTruncate, {
    amount: amount.quotient,
    symbol: amount.currency.symbol,
    maxWidth: 70,
  })

const feeForSure = computed(() => {
  const { value } = fee
  invariant(value)
  return value
})
</script>

<template>
  <div class="root py-4 space-y-4">
    <div class="px-4 space-y-4">
      <div :class="[cssRows.rowSm]">
        <span>Price</span>
        <div>
          ~<CurrencyFormatTruncate
            :amount="priceUsd"
            usd
          />
        </div>
      </div>

      <DetailsRowSlippage :data="slippageDataForSure" />

      <div :class="[cssRows.rowSm, cssRows.rowSmDimmed]">
        <span>Price Impact</span>
        <span>{{ formattedPriceImpact }}</span>
      </div>

      <DetailsRowFee :data="feeForSure" />
    </div>

    <div class="klay-divider" />

    <p class="px-4 note">
      <template v-if="slippageDataForSure.kind === 'exact-in'">
        Output is estimated. You will receive at least
        <CurrencyInTheNote :amount="slippageDataForSure.amountOutMin" />
        or the transaction will revert.
      </template>
      <template v-else>
        Input is estimated. You will send at most
        <CurrencyInTheNote :amount="slippageDataForSure.amountInMax" />
        or the transaction will revert.
      </template>
    </p>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.root {
  border: 1px solid vars.$gray5;
  border-radius: 8px;
}

.note {
  font-weight: 500;
  font-size: 12px;
  line-height: 180%;
  color: #8b93a1;
}
</style>
