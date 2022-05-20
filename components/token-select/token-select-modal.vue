<template>
  <Modal
    padding="20px 0"
    width="344"
    label="Select a token"
    @close="$emit('close')"
  >
    <div class="row">
      <div class="token-select-modal">
        <div class="token-select-modal--input">
          <p>Search name or paste adress</p>
          <input v-model="searchValue" type="text" placeholder="KLAY" />
        </div>
      </div>
    </div>


    <div class="token-select-modal--recent row">
      <div
        class="token-select-modal--tag"
        v-for="t in renderTokens.slice(0, 6)"
        @click="onSelect(t)"
      >
        <TagName :label="t.symbol" :key="t.symbol">
          <Icon :char="t.symbol[0]" name="empty-token" />
          <!--          <img class="token-logo" :src="t.logo" alt="token logo" />-->
        </TagName>
      </div>
    </div>

    <div class="token-select-modal--list">
      <div
        v-if="importToken"
        class="token-select-modal--item"
        @click="onAddToken"
      >
        <Icon :char="importToken.symbolA[0]" name="empty-token" />
        <div class="info">
          <p class="token">{{ importToken.symbol }}</p>
          <span class="token-name">{{ importToken.name }}</span>
        </div>
        <button class="token-select-modal--import">Import</button>
      </div>

      <div
        v-for="t in renderTokens"
        :key="t.address"
        class="token-select-modal--item"
        :class="{ 'token-select-modal--item-disabled': Number(t.balance) <= 0 }"
        @click="onSelect(t)"
      >
        <Icon :char="t.symbol[0]" name="empty-token" />
        <div class="info">
          <p class="token">{{ t.symbol }}</p>
          <span class="token-name">{{ t.name.toLowerCase() }}</span>
        </div>
        <TextField :title="`${t.balance} ${t.symbol}`" class="token-count">
          {{ getRenderBalance(t.balance) }} {{ t.symbol }}
        </TextField>
      </div>
    </div>
  </Modal>
</template>

<script>
import { mapMutations, mapState } from "vuex";
import kep7 from "~/utils/smartcontracts/kep-7.json";

export default {
  name: "TokenSelectModal",
  data() {
    return {
      searchValue: "",
      importToken: null,
    };
  },
  computed: {
    ...mapState("tokens", ["tokensList"]),
    renderTokens() {
      return this.tokensList.filter(
        (token) =>
          token.symbol.search(this.searchValue.toUpperCase()) !== -1 ||
          token.address === this.searchValue
      );
    },
  },
  methods: {
    ...mapMutations({
      updateTokens: "tokens/SET_TOKENS",
    }),
    getRenderBalance(balance){
      const value = this.$kaikas.bigNumber(this.$kaikas.fromWei(balance))
      return value.toFixed(4)
    },
    onSelect(t) {
      if (Number(t.balance) <= 0) {
        return;
      }

      this.$emit("select", t);
    },
    onAddToken() {
      if (this.importToken) {
        this.updateTokens([this.importToken, ...this.tokensList]);
        this.searchValue = "";
        this.importToken = null;
        this.$notify({ type: 'success', text: 'Token added' })
      }
    },
  },
  watch: {
    async searchValue(_new) {
      const code =
        this.$kaikas.isAddress(_new) &&
        (await this.$kaikas.caver.klay.getCode(_new));
      const isExists = this.tokensList.find(({ address }) => address === _new);

      if (!this.$kaikas.isAddress(_new) || code === "0x" || isExists) {
        this.importToken = null;
        return;
      }

      try {
        const contract = this.$kaikas.createContract(_new, kep7.abi);

        const symbol = await contract.methods.symbol().call({
          from: this.$kaikas.address,
        });

        const name = await contract.methods.name().call({
          from: this.$kaikas.address,
        });

        const balance = await contract.methods
          .balanceOf(this.$kaikas.address)
          .call();

        this.importToken = {
          id: _new,
          name,
          symbol,
          logo: "-",
          balance,
          slug: "-",
          address: _new,
        };
      } catch (e) {
        console.log(e);
      }
    },
  },
};
</script>

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
