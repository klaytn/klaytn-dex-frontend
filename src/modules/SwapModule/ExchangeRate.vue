<script setup lang="ts" name="SwapModuleExchangeRate">
import { storeToRefs } from 'pinia'
import { tokenRawToWei, tokenWeiToRaw } from '@/core/kaikas'
import { TokenType } from '@/store/swap'

const swapStore = useSwapStore()
const { areSelectedTokensValidToSwap: isValid, getAmountPendingState, isEmptyPairAddress } = $(storeToRefs(swapStore))

const useTokenModel = (type: TokenType) => ({
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
})

const models = reactive({
  tokenA: useTokenModel('tokenA'),
  tokenB: useTokenModel('tokenB'),
})
</script>

<template>
  <div>
    <TokenInput
      v-model="models.tokenA.wei"
      v-model:token="models.tokenA.addr"
      :is-loading="getAmountPendingState === 'tokenA'"
      :is-disabled="!isValid"
    />
    <button class="change-btn">
      <KlayIcon name="arrow-down" />
    </button>
    <div class="margin-block">
      <TokenInput
        v-model="models.tokenB.wei"
        v-model:token="models.tokenB.addr"
        :is-loading="getAmountPendingState === 'tokenB'"
        :is-disabled="!isValid"
      />
    </div>

    <div
      v-if="isEmptyPairAddress"
      class="warning-text"
    >
      <KlayIcon name="important" />
      <span>Pair not exist</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.change-btn {
  width: 100%;
  margin: auto;
  margin-top: -10px;
}

.margin-block {
  margin: -10px 0;
}

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
