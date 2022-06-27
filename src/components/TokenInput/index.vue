<script lang="ts">
import { mapActions, mapState } from 'pinia'
import { roundTo } from 'round-to'
import web3 from 'web3'
import { copyToClipboard } from '@/utils/common'

export default {
  name: 'TokenInput',
  props: {
    tokenType: {
      type: String,
      required: true,
    },
    isLoading: {
      type: Boolean,
    },
    isDisabled: {
      type: Boolean,
    },
  },
  emits: ['input'],
  computed: {
    ...mapState(useTokensStore, ['selectedTokens']),
    selected() {
      return this.selectedTokens[this.tokenType]
    },
    renderBalance() {
      return roundTo(Number(web3.utils.fromWei(this.selected.balance)), 5)
    },
    price() {
      return '-'
      // return this.selected?.price?.price
      //   ? `$${roundTo(this.selected?.price?.price, 5)}`
      //   : "Price loading";
    },
    value() {
      if (!this.selected?.value)
        return null

      const bn = $kaikas.bigNumber(
        $kaikas.fromWei(this.selected.value),
      )

      return Number(bn.toFixed(4))
    },
    formattedAddress() {
      return $kaikas.getFormattedAddress(this.selected.address)
    },
  },
  methods: {
    ...mapActions(useTokensStore, [
      'checkEmptyPair',
      'setSelectedToken',
    ]),
    ...mapActions(useSwapStore, [
      'setComputedToken',
    ]),
    copyToClipboard,
    async setToken(token) {
      this.setSelectedToken({ token, type: this.tokenType })
      await this.checkEmptyPair()
    },
    input(v) {
      this.$emit('input', v)
    },
  },
}
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
        @input="input($event.target.value)"
      >

      <button v-if="selected" @click="input(renderBalance.toString())">
        MAX
      </button>
      <div class="token-select-wrap">
        <TokenSelect :selected-token="selected" @select="setToken" />
      </div>
    </div>
    <div v-if="selected" class="token-meta">
      <span class="price">{{ price }}</span>
      <div v-if="selected" class="row">
        <KlayTextField :title="selected.balance" class="price">
          Balance: {{ renderBalance }}
        </KlayTextField>

        <KlayIcon name="important" />

        <div class="token-info">
          <p>{{ selected.name }} {{ `(${selected.symbol})` }}</p>
          <span class="price">{{ price }}</span>
          <span class="percent">0.26%</span>
          <a
            :href="`https://coinmarketcap.com/currencies/${selected.slug}/`"
            class="link"
            target="_blank"
          >
            <span class="link-name">Coinmarketcap</span>
            <KlayIcon name="link" />
          </a>
          <div class="address" @click="copyToClipboard(selected.address)">
            <span class="address-name">{{ formattedAddress }}</span>
            <KlayIcon name="copy" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./index.scss" />
