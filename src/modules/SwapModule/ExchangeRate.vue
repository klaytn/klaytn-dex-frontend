<script setup lang="ts" name="SwapModuleExchangeRate">
import { useDanglingScope, useTask } from '@vue-kakuyaku/core'
import { storeToRefs } from 'pinia'
import { toWei } from '@/core/kaikas'

const tokensStore = useTokensStore()
const { selectedTokens } = $(storeToRefs(tokensStore))

const swapStore = useSwapStore()

const isNotValid = $computed(() => {
  return !selectedTokens.tokenA || !selectedTokens.tokenB || selectedTokens.emptyPair
})

const exchangeScope = useDanglingScope<{ exchangeToken: 'tokenA' | 'tokenB'; pending: boolean }>()

const onInputDebounced = useDebounceFn(
  (
    // FIXME is it ether value?
    valueEther: string,
    tokenType: 'tokenA' | 'tokenB',
  ) => {
    if (!valueEther || isNotValid) return
    const valueWei = toWei(valueEther, 'ether')

    tokensStore.setSelectedToken({
      token: {
        ...selectedTokens[tokenType]!,
        value: valueWei,
      },
      type: tokenType,
    })

    const exchangeToken = tokenType === 'tokenA' ? 'tokenB' : 'tokenA'

    tokensStore.setComputedToken(exchangeToken)

    exchangeScope.setup(() => {
      const task = useTask(async () => {
        if (tokenType === 'tokenA') {
          await swapStore.getAmount(valueWei, 'out')
        } else {
          await swapStore.getAmount(valueWei, 'in')
        }
      })

      task.run()

      return reactive({ exchangeToken, pending: computed(() => task.state.kind === 'pending') })
    })
  },
  500,
)

const exchangeLoading = $computed(() => {
  const scope = exchangeScope.scope.value?.setup
  if (!scope?.pending) return null
  return scope.exchangeToken
})
</script>

<template>
  <div>
    <TokenInput
      :is-loading="exchangeLoading === 'tokenA'"
      token-type="tokenA"
      :is-disabled="isNotValid"
      @input="(v: string) => onInputDebounced(v, 'tokenA')"
    />
    <button class="change-btn">
      <KlayIcon name="arrow-down" />
    </button>
    <div class="margin-block">
      <TokenInput
        :is-loading="exchangeLoading === 'tokenB'"
        token-type="tokenB"
        :is-disabled="isNotValid"
        @input="(v: string) => onInputDebounced(v, 'tokenB')"
      />
    </div>

    <div
      v-if="selectedTokens.emptyPair"
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
