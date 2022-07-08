<script setup lang="ts" name="SwapModuleExchangeRate">
import { storeToRefs } from 'pinia'
import { tokenRawToWei, tokenWeiToRaw } from '@/core/kaikas'
import { TokenType, buildPair } from '@/store/swap'

const swapStore = useSwapStore()
const { areSelectedTokensValidToSwap: isValid, getAmountPendingState, isEmptyPairAddress } = $(storeToRefs(swapStore))

const models = reactive(
  buildPair((type) => ({
    wei: computed({
      get: () => {
        const token = swapStore.selectionTokens[type]
        const wei = swapStore.selection[type]?.inputWei
        if (!token || !wei) return null
        const raw = tokenWeiToRaw(token, wei)
        return raw
      },
      set: (raw) => {
        if (!raw) return
        const token = swapStore.selectionTokens[type]
        if (!token) return
        const wei = tokenRawToWei(token, raw)
        swapStore.setTokenValue(type, wei)
      },
    }),
    addr: computed({
      get: () => swapStore.selection[type]?.addr,
      set: (addr) => {
        if (!addr) return
        swapStore.setToken(type, addr)
      },
    }),
  })),
)
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <TokenInput
        v-model="models.tokenA.wei"
        v-model:token="models.tokenA.addr"
        :is-loading="getAmountPendingState === 'tokenA'"
      />
      <div class="w-full flex justify-center items-center h-0">
        <KlayIcon name="arrow-down" />
      </div>
      <TokenInput
        v-model="models.tokenB.wei"
        v-model:token="models.tokenB.addr"
        :is-loading="getAmountPendingState === 'tokenB'"
        :is-disabled="!models.tokenA.addr"
      />
    </div>

    <div
      v-if="isEmptyPairAddress === 'empty'"
      class="warning-text"
    >
      <KlayIcon name="important" />
      <span>Pair not exist</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.warning-text {
  margin-top: 16px;
  font-style: normal;
  font-weight: 700;
  font-size: 14px;
  line-height: 180%;
  color: #2d2926;
  margin-right: 5px;
  display: flex;
  align-items: center;
  justify-content: center;

  & .svg-icon {
    height: 20px;
  }

  & span {
    margin-left: 5px;
  }
}
</style>
