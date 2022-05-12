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
          <!--          <Icon name="eth"></Icon>-->
          <img class="token-logo" :src="t.logo" alt="token logo" />
        </TagName>
      </div>
    </div>

    <div class="token-select-modal--list">
      <div
        v-for="t in renderTokens"
        :key="t.address"
        class="token-select-modal--item"
        @click="onSelect(t)"
      >
        <img class="token-logo" :src="t.logo" alt="token logo" />
        <div class="info">
          <p class="token">{{ t.symbol }}</p>
          <span class="token-name">{{ t.name.toLowerCase() }}</span>
        </div>
        <TextField :title="`${t.balance} ${t.symbol}`" class="token-count"
          >{{ t.balance }} {{ t.symbol }}</TextField
        >
      </div>
    </div>
  </Modal>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "TokenSelectModal",
  data() {
    return {
      searchValue: "",
    };
  },
  computed: {
    ...mapState("tokens", ["tokensList"]),
    renderTokens() {
      return this.tokensList.filter(
        (token) => token.symbol.search(this.searchValue.toUpperCase()) !== -1
      );
    },
  },
  methods: {
    onSelect(t) {
      // if (Number(t.balance) <= 0) {
      //   return;
      // }
      this.$emit("select", t);
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
}
</style>
