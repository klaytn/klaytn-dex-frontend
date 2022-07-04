<script lang="ts" setup>
import { roundTo } from 'round-to'
import invariant from 'tiny-invariant'
import { formatAddress, Token, fromWei } from '@/core/kaikas'
import BigNumber from 'bignumber.js'

const props = withDefaults(
  defineProps<{
    tokenType: 'tokenA' | 'tokenB'
    isLoading?: boolean
    isDisabled?: boolean
  }>(),
  {
    isLoading: false,
    isDisabled: false,
  },
)

const emit = defineEmits<(event: 'input', value: string) => void>()

const tokensStore = useTokensStore()

const selectedTokens = $computed(() => tokensStore.selectedTokens)

const selected = $computed(() => {
  const item = selectedTokens[props.tokenType]
  invariant(item)
  return item
})

const renderBalance = $computed(() => {
  return roundTo(Number(fromWei(selected.balance)), 5)
})

/**
 * FIXME what the hell is this value?
 */
const value = $computed(() => {
  if (!selected.value) return null

  const bn = new BigNumber(fromWei(selected.value))
  return Number(bn.toFixed(4))
})

const price = $computed(() => {
  return '-'
  // return this.selected?.price?.price
  //   ? `$${roundTo(this.selected?.price?.price, 5)}`
  //   : "Price loading";
})

const formattedAddress = $computed(() => {
  return formatAddress(selected.address)
})

async function setToken(token: Token) {
  tokensStore.setSelectedToken({ token, type: props.tokenType })
  await tokensStore.checkEmptyPair()
}

function input(value: string) {
  emit('input', value)
}

function inputFromHtmlInput(e: Event) {
  input((e.target as HTMLInputElement).value)
}

const clipboard = useClipboard()
</script>

<template>
  <div
    class="token-input"
    :class="{ 'token-loading': isLoading }"
  >
    <div class="token-value">
      <input
        v-if="selected"
        :disabled="isDisabled"
        :value="!isDisabled ? value : null"
        placeholder="0"
        type="number"
        @input="inputFromHtmlInput"
      >

      <button
        v-if="selected"
        @click="input(renderBalance.toString())"
      >
        MAX
      </button>
      <div class="token-select-wrap">
        <TokenSelect
          :selected-token="selected"
          @select="setToken"
        />
      </div>
    </div>
    <div
      v-if="selected"
      class="token-meta"
    >
      <span class="price">{{ price }}</span>
      <div
        v-if="selected"
        class="row"
      >
        <KlayTextField
          :title="selected.balance"
          class="price"
        >
          Balance: {{ renderBalance }}
        </KlayTextField>

        <KlayIcon name="important" />

        <div class="token-info">
          <p>{{ selected.name }} {{ `(${selected.symbol})` }}</p>
          <span class="price">{{ price }}</span>
          <span class="percent">0.26%</span>

          <!-- FIXME `slug` field is always unset -->
          <!-- Should it be removed at all? -->
          <!-- <a
            :href="`https://coinmarketcap.com/currencies/${selected.slug}/`"
            class="link"
            target="_blank"
          >
            <span class="link-name">Coinmarketcap</span>
            <KlayIcon name="link" />
          </a> -->

          <div
            class="address"
            @click="clipboard.copy(selected.address)"
          >
            <span class="address-name">{{ formattedAddress }}</span>
            <KlayIcon name="copy" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./index.scss" />
