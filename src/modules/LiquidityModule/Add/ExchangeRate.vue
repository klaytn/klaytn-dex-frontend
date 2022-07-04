<script lang="ts" setup>
// FIXME component is closely the same as `src/modules/SwapModule/ExchangeRate.vue`
// remove code duplication

import { ValueWei } from '@/core/kaikas'
import { useDanglingScope, useTask } from '@vue-kakuyaku/core'
import { storeToRefs } from 'pinia'
import { toWei } from 'web3-utils'

const tokensStore = useTokensStore()
const { selectedTokens } = $(storeToRefs(tokensStore))

const liquidityStore = useLiquidityStore()

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
    const valueWei = toWei(valueEther, 'ether') as ValueWei<string>

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
        await liquidityStore.quoteForToken(valueWei, exchangeToken)
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
    <div class="liquidity--input">
      <TokenInput
        :is-loading="exchangeLoading === 'tokenA'"
        token-type="tokenA"
        :is-disabled="isNotValid"
        @input="(v: string) => onInputDebounced(v, 'tokenA')"
      />
    </div>

    <div class="liquidity--icon">
      <KlayIcon name="plus" />
    </div>

    <div class="liquidity--input">
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
.liquidity {
  &--slippage {
    margin-top: 16px;
  }

  &--input:first-child {
    margin-bottom: -8px;
  }

  & .error {
    text-align: center;
    margin-top: 16px;
    font-weight: 700;
  }

  & .submitted {
    padding-top: 98px;
    padding-bottom: 138px;
    text-align: center;

    & p {
      font-style: normal;
      font-weight: 700;
      font-size: 18px;
      line-height: 180%;
      color: $dark2;
    }
  }

  & .m-title {
    color: $dark2;
    font-style: normal;
    font-weight: 700;
    font-size: 14px;
    line-height: 17px;
    margin-bottom: 7px;
  }

  & .m-content {
    padding: 16px;
    box-sizing: border-box;
  }

  & .m-head {
    display: flex;
    align-items: center;
    font-style: normal;
    font-weight: 600;
    font-size: 30px;
    line-height: 36px;
    color: $dark2;

    & img {
      width: 36px;
    }
  }

  &--icon {
    width: min-content;
    margin: auto;
    margin-bottom: -8px;
  }

  &--btn {
    margin-top: 16px;
  }

  &--details {
    border: 1px solid #dfe4ed;
    border-radius: 8px;
    padding: 16px;
    text-align: left;
    margin-top: 16px;

    & h3 {
      font-style: normal;
      font-weight: 700;
      font-size: 14px;
      line-height: 17px;
      color: $dark2;
    }

    &--row {
      display: flex;
      justify-content: space-between;
      font-style: normal;
      font-weight: 600;
      font-size: 12px;
      line-height: 230%;
      color: $dark2;
    }
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
}
</style>
