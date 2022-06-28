<script setup lang="ts" name="SwapModuleExchangeRate">
import debounce from 'debounce'

const tokensStore = useTokensStore()
const { selectedTokens } = toRefs(tokensStore)
const { setSelectedToken, setComputedToken } = tokensStore

const { getAmountOut, getAmountIn } = useSwapStore()

const exchangeLoading = ref<'tokenA' | 'tokenB' | null>(null)

const isNotValid = computed(() => {
  return (
    !selectedTokens.value.tokenA
    || !selectedTokens.value.tokenB
    || selectedTokens.value.emptyPair
  )
})

const onInput = debounce(async (_v, tokenType: 'tokenA' | 'tokenB') => {
  if (!_v || isNotValid.value)
    return

  // if (this.exchangeRateIntervalID) {
  //   clearInterval(this.exchangeRateIntervalID);
  //   this.setExchangeRateIntervalID(null);
  // }

  const value = $kaikas.toWei(_v)

  setSelectedToken({
    token: {
      ...selectedTokens.value[tokenType],
      value,
    },
    type: tokenType,
  })

  setComputedToken(tokenType === 'tokenA' ? 'tokenB' : 'tokenA')

  if (tokenType === 'tokenA') {
    exchangeLoading.value = 'tokenB'
    await getAmountOut(value)
    // this.setExchangeRateIntervalID(
    //   setInterval(() => this.getAmountOut(value), 5000)
    // );
  }

  if (tokenType === 'tokenB') {
    exchangeLoading.value = 'tokenA'
    await getAmountIn(value)
    // this.setExchangeRateIntervalID(
    //   setInterval(() => this.getAmountIn(value), 5000)
    // );
  }

  exchangeLoading.value = null
}, 500)
</script>

<template>
  <div>
    <TokenInput
      :is-loading="exchangeLoading === 'tokenA'"
      token-type="tokenA"
      :is-disabled="isNotValid"
      @input="(v) => onInput(v, 'tokenA')"
    />
    <button class="change-btn">
      <KlayIcon name="arrow-down" />
    </button>
    <div class="margin-block">
      <TokenInput
        :is-loading="exchangeLoading === 'tokenB'"
        token-type="tokenB"
        :is-disabled="isNotValid"
        @input="(v) => onInput(v, 'tokenB')"
      />
    </div>

    <div v-if="selectedTokens.emptyPair" class="warning-text">
      <KlayIcon name="important" />
      <span>Pair not exist</span>
    </div>
  </div>
</template>

<style lang="scss" scoped src="./index.scss" />
