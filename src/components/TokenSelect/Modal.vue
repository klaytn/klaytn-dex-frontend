<script>
import { mapActions, mapState } from 'pinia'
import kip7 from '@/utils/smartcontracts/kip-7.json'

export default {
  name: 'TokenSelectModal',
  emits: ['close', 'select'],
  data() {
    return {
      searchValue: '',
      importToken: null,
    }
  },
  computed: {
    ...mapState(useTokensStore, ['tokensList']),
    renderTokens() {
      return this.tokensList.filter(
        token =>
          token.symbol.search(this.searchValue.toUpperCase()) !== -1
          || token.address === this.searchValue,
      )
    },
  },
  watch: {
    async searchValue(_new) {
      const code
        = $kaikas.utils.isAddress(_new)
        && (await $kaikas.config.caver.klay.getCode(_new))

      const isExists = this.tokensList.find(({ address }) => address === _new)

      if (!$kaikas.isAddress(_new) || code === '0x' || isExists) {
        this.importToken = null
        return
      }
      try {
        const contract = $kaikas.config.createContract(_new, kip7.abi)
        const symbol = await contract.methods.symbol().call()
        const name = await contract.methods.name().call()

        const balance = await contract.methods
          .balanceOf($kaikas.config.address)
          .call()
        this.importToken = {
          id: _new,
          name,
          symbol,
          logo: '-',
          balance,
          slug: '-',
          address: _new,
        }
      }
      catch (e) {
        console.log(e)
      }
    },
  },
  methods: {
    ...mapActions(useTokensStore, {
      updateTokens: 'setTokens',
    }),
    getRenderBalance(balance) {
      const value = $kaikas.bigNumber($kaikas.fromWei(balance))
      return value.toFixed(4)
    },
    onSelect(t) {
      if (Number(t.balance) <= 0)
        return

      this.$emit('select', t)
    },
    onAddToken() {
      if (this.importToken) {
        this.updateTokens([this.importToken, ...this.tokensList])
        this.searchValue = ''
        this.importToken = null
        this.$notify({ type: 'success', text: 'Token added' })
      }
    },
  },
}
</script>

<template>
  <KlayModal
    padding="20px 0"
    width="344"
    label="Select a token"
    @close="$emit('close')"
  >
    <div class="row">
      <div class="token-select-modal">
        <div class="token-select-modal--input">
          <p>Search name or paste adress</p>
          <input v-model="searchValue" type="text" placeholder="KLAY">
        </div>
      </div>
    </div>

    <div class="token-select-modal--recent row">
      <div
        v-for="t in renderTokens.slice(0, 6)"
        :key="t.address"
        class="token-select-modal--tag"
        @click="onSelect(t)"
      >
        <TagName :key="t.symbol" :label="t.symbol">
          <KlayIcon :char="t.symbol[0]" name="empty-token" />
          <!--          <img class="token-logo" :src="t.logo" alt="token logo" /> -->
        </TagName>
      </div>
    </div>

    <div class="token-select-modal--list">
      <div
        v-if="importToken"
        class="token-select-modal--item"
        @click="onAddToken"
      >
        <KlayIcon :char="importToken.symbol[0]" name="empty-token" />
        <div class="info">
          <p class="token">
            {{ importToken.symbol }}
          </p>
          <span class="token-name">{{ importToken.name }}</span>
        </div>
        <button type="button" class="token-select-modal--import">
          Import
        </button>
      </div>

      <div
        v-for="t in renderTokens"
        :key="t.address"
        class="token-select-modal--item"
        :class="{ 'token-select-modal--item-disabled': Number(t.balance) <= 0 }"
        @click="onSelect(t)"
      >
        <KlayIcon :char="t.symbol[0]" name="empty-token" />
        <div class="info">
          <p class="token">
            {{ t.symbol }}
          </p>
          <span class="token-name">{{ t.name.toLowerCase() }}</span>
        </div>
        <KlayTextField :title="`${t.balance} ${t.symbol}`" class="token-count">
          {{ getRenderBalance(t.balance) }} {{ t.symbol }}
        </KlayTextField>
      </div>
    </div>
  </KlayModal>
</template>

<style scoped lang="scss">
.row {
  padding: 0 17px;
}

.token-select-modal {
  margin-top: 17px;
  width: 100%;
  background: $gray3;
  border-radius: 8px;
  padding: 10px 16px;

  & p {
    color: $gray4;
    font-weight: 500;
    font-size: 12px;
    line-height: 180%;
  }

  & input {
    font-style: normal;
    font-weight: 600;
    font-size: 14px;
    line-height: 180%;
    color: $dark;
    background: none;
    border: none;
    width: 100%;
  }

  &--recent {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 16px;
  }

  &--tag {
    margin-right: 8px;
    margin-bottom: 8px;
    cursor: pointer;
  }

  &--list {
    margin-top: 17px;
    max-height: 400px;
  }

  &--item {
    display: flex;
    align-items: flex-start;
    padding: 8px 17px;
    border-top: 1px solid $gray5;
    cursor: pointer;

    &-disabled {
      opacity: 0.5 !important;
      cursor: default !important;

      &:hover {
        background: $white !important;
      }
    }

    &:hover {
      background: $gray3;
    }

    &:last-child {
      border-bottom: 1px solid $gray5;
    }

    & .info {
      margin-left: 5px;
    }

    & .token {
      font-style: normal;
      font-weight: 600;
      font-size: 14px;
      line-height: 17px;
      color: $dark;
    }

    & .token-name {
      font-style: normal;
      font-weight: 500;
      font-size: 12px;
      line-height: 180%;
      color: $gray4;
    }

    & .token-logo {
      display: block;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: contain;
    }

    .token-count {
      font-style: normal;
      font-weight: 600;
      font-size: 14px;
      line-height: 17px;
      color: $dark;
      margin-left: auto;
      max-width: 150px;
    }
  }

  &--import {
    background: $blue;
    border-radius: 10px;
    color: $white;
    margin-left: auto;
    font-weight: 700;
    font-size: 12px;
    line-height: 18px;
    padding: 7px 24px;
    cursor: pointer;
  }
}
</style>
