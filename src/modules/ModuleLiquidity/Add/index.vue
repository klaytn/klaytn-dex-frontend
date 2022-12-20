<script lang="ts" setup>
import { WeiAsToken } from '@/core'
import { useTradeStore } from '@/modules/ModuleTradeShared/trade-store'
import { useMinimalTokensApi } from '@/utils/minimal-tokens-api'
import { TOKEN_TYPES, buildPair } from '@/utils/pair'
import BigNumber from 'bignumber.js'
import { storeToRefs } from 'pinia'

const dexStore = useDexStore()
const liquidityAddStore = useLiquidityAddStore()
const { tokenValues, addrs } = storeToRefs(liquidityAddStore)

const { lookupBalance, lookupToken } = useMinimalTokensApi()

onUnmounted(() => liquidityAddStore.resetInput())

const values = reactive(
  buildPair((type) => {
    return {
      input: computed<WeiAsToken<BigNumber>>(() => {
        const val = tokenValues.value[type]
        return new BigNumber(val ?? '0') as WeiAsToken<BigNumber>
      }),
      balance: computed<WeiAsToken<BigNumber> | null>(() => {
        const address = addrs.value[type]
        const balance = address && lookupBalance(address)
        const token = address && lookupToken(address)
        const balanceAsToken = balance && token && balance.decimals(token)
        return balanceAsToken
      }),
    }
  }),
)

const isThereAnyValueExceedsBalance = computed(() => {
  return TOKEN_TYPES.some((type) => {
    const value = values[type]
    return value.balance && value.input.isGreaterThan(value.balance)
  })
})

const isSupplyDisabled = computed(() => {
  return !liquidityAddStore.finalRates || !dexStore.isWalletConnected || isThereAnyValueExceedsBalance.value
})

const supplyLabel = computed(() => {
  return dexStore.isWalletConnected ? 'Supply' : 'Connect Wallet'
})

useTradeStore().useRefresh({
  run: () => liquidityAddStore.refresh(),
  pending: toRef(liquidityAddStore, 'isRefreshing'),
})
</script>

<template>
  <ModuleLiquidityAddConfirmModal />

  <div class="space-y-4 px-4">
    <ModuleLiquidityAddExchangeRate />

    <SlippageToleranceInput v-model="liquidityAddStore.slippageNumeric" />

    <KlayButton
      class="w-full"
      size="lg"
      type="primary"
      :disabled="isSupplyDisabled"
      :loading="liquidityAddStore.supplyScope?.prepareState.pending"
      @click="liquidityAddStore.prepareSupply()"
    >
      {{ supplyLabel }}
    </KlayButton>

    <ModuleLiquidityAddDetails />
  </div>
</template>
