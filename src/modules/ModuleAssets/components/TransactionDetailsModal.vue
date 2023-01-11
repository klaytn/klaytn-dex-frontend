<script setup lang="ts">
import { TransactionEnum, parseSwapAmounts } from '../query.transactions'
import { SModal } from '@soramitsu-ui/ui'
import BigNumber from 'bignumber.js'
import { useMinimalTokensApi } from '@/utils/minimal-tokens-api'
import { makeExplorerLinkToTransaction } from '@/core'
import RowTemplate from './TransactionDetailsModalRow.vue'

const props = defineProps<{
  item?: TransactionEnum | null
}>()

const emit = defineEmits(['close'])

const showModel = computed({
  get: () => !!props.item,
  set: (v) => !v && emit('close'),
})

const actionFormatted = computed(() => {
  const { item } = props
  return item && (item.kind === 'swap' ? 'Swap' : item.kind === 'burn' ? 'Remove' : 'Receive')
})

const { lookupDerivedUsd } = useMinimalTokensApi()

const explorerLink = computed(() => {
  const { item } = props
  return item?.id && makeExplorerLinkToTransaction(item.transaction.id)
})

const timestamp = computed(() => props.item && new Date(Number(props.item.timestamp) * 1000))

const dateFormatter = Intl.DateTimeFormat('en', { dateStyle: 'medium' })
const timeFormatter = Intl.DateTimeFormat('en', { timeStyle: 'medium' })

const dateFormatted = computed(() => timestamp.value && dateFormatter.format(timestamp.value))
const timeFormatted = computed(() => timestamp.value && timeFormatter.format(timestamp.value))

interface CurrFormatProps {
  amount?: string | BigNumber
  symbol?: string
  usd?: boolean
  decimals?: number
}

interface TokenUsdFormat {
  token: CurrFormatProps
  usd?: null | CurrFormatProps
}

type DetailsParsed =
  | { kind: 'swap'; amounts: Record<'in' | 'out', TokenUsdFormat> }
  | ({ kind: 'mint-burn'; liquidity: CurrFormatProps } & Record<'token0' | 'token1', TokenUsdFormat>)

const detailsParsed = computed<null | DetailsParsed>(() => {
  const { item } = props
  if (!item) return null

  if (item.kind === 'swap') {
    const amounts = parseSwapAmounts(item)

    const amountFn = (type: 'in' | 'out'): TokenUsdFormat => {
      const token = item.pair[amounts[type].token]
      const usd = lookupDerivedUsd(token.id)
      const amount = amounts[type].amount
      return {
        token: { amount, symbol: token.symbol },
        usd: { amount: usd?.times(amount), usd: true, decimals: 2 },
      }
    }

    return {
      kind: 'swap',
      amounts: { in: amountFn('in'), out: amountFn('out') },
    }
  }

  const amountFn = (type: 'token0' | 'token1'): TokenUsdFormat => {
    const token = item.pair[type]
    const amount = item[type === 'token0' ? 'amount0' : 'amount1']
    const usd = lookupDerivedUsd(token.id)
    return {
      token: { amount, symbol: token.symbol },
      usd: { amount: usd?.times(amount), usd: true, decimals: 2 },
    }
  }

  return {
    kind: 'mint-burn',
    liquidity: {
      amount: item.liquidity,
      symbol: `${item.pair.token0.symbol}-${item.pair.token1.symbol}`,
    },
    token0: amountFn('token0'),
    token1: amountFn('token1'),
  }
})
</script>

<template>
  <SModal v-model:show="showModel">
    <KlayModalCard
      title="Transaction details"
      class="w-344px"
    >
      <template #body>
        <div class="space-y-4 px-4 pb-5">
          <div class="flex items-center">
            <div class="title-action flex-1">
              {{ actionFormatted }}
            </div>

            <KlayExternalLink
              :href="explorerLink"
              class="text-sm font-medium"
            >
              View on explorer
            </KlayExternalLink>
          </div>

          <hr class="klay-divider">

          <RowTemplate two-line>
            <template #title>
              Date
            </template>
            <template #value-top>
              {{ dateFormatted }}
            </template>
            <template #value-sub>
              {{ timeFormatted }}
            </template>
          </RowTemplate>

          <template v-if="detailsParsed?.kind === 'swap'">
            <template
              v-for="(x) in (['in', 'out'] as const)"
              :key="x"
            >
              <hr class="klay-divider">

              <RowTemplate two-line>
                <template #title>
                  Amount {{ x }}
                </template>
                <template #value-top>
                  <CurrencyFormatTruncate
                    v-bind="detailsParsed.amounts[x].token"
                    max-width="auto"
                  />
                </template>
                <template #value-sub>
                  <CurrencyFormatTruncate
                    v-bind="detailsParsed.amounts[x].usd"
                    max-width="auto"
                  />
                </template>
              </RowTemplate>
            </template>
          </template>

          <template v-else-if="detailsParsed">
            <hr class="klay-divider">

            <RowTemplate>
              <template #title>
                LP Tokens
              </template>
              <template #value>
                <CurrencyFormatTruncate
                  v-bind="detailsParsed.liquidity"
                  max-width="auto"
                />
              </template>
            </RowTemplate>

            <template
              v-for="x in (['token0', 'token1'] as const)"
              :key="x"
            >
              <hr class="klay-divider">

              <RowTemplate two-line>
                <template #title>
                  Amount {{ detailsParsed[x].token.symbol }}
                </template>
                <template #value-top>
                  <CurrencyFormatTruncate
                    v-bind="detailsParsed[x].token"
                    max-width="auto"
                  />
                </template>
                <template #value-sub>
                  <CurrencyFormatTruncate
                    v-bind="detailsParsed[x].usd"
                    max-width="auto"
                  />
                </template>
              </RowTemplate>
            </template>
          </template>
        </div>
      </template>
    </KlayModalCard>
  </SModal>
</template>

<style scoped lang="scss">
hr {
  width: 100%;
}

.title-action {
  font-weight: 600;
  font-size: 24px;
}
</style>
