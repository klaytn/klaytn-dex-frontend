<script>
export default {
  name: 'TokenSelect',
  props: {
    selectedToken: {
      type: Object,
      default: null,
    },
  },
  emits: ['select'],
  data() {
    return {
      modalOpen: false,
    }
  },
  methods: {
    onSelect(token) {
      this.modalOpen = false
      this.$emit('select', token)
    },
  },
}
</script>

<template>
  <div class="select--wrap">
    <TokenSelectModal
      v-if="modalOpen"
      @select="onSelect"
      @close="modalOpen = false"
    />
    <button v-if="!selectedToken" class="select-btn" @click="modalOpen = true">
      <span>Select token</span>
      <KlayIcon name="collapse-arrow" />
    </button>

    <div v-if="selectedToken" class="select">
      <div class="select--head" @click="modalOpen = true">
        <!--        <img v-if="selectedToken" :src="selectedToken.logo" alt="Token logo" /> -->
        <KlayIcon :char="selectedToken.symbol[0]" name="empty-token" />
        <span v-if="selectedToken">
          {{ selectedToken.symbol }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.select {
  width: 100px;
  height: 40px;
  background: $white;
  border-radius: 8px;
  box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.07);
  margin-left: 8px;
  position: relative;

  &::after {
    display: none !important;
  }

  &-btn {
    background: $blue;
    color: $white;
    width: 130px;
    text-align: center;
    border-radius: 8px;
    padding: 12px 12px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &--head {
    width: 100%;
    display: flex;
    height: 100%;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px 10px 10px;
    cursor: pointer;

    & img {
      display: block;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: contain;
    }

    & span {
      text-overflow: ellipsis;
      overflow-x: hidden;
      max-width: calc(100% - 30px);
      width: min-content;
      margin-right: auto;
      font-style: normal;
      font-weight: 600;
      font-size: 14px;
      line-height: 17px;
      color: $dark2;
      margin-left: 8px;
    }
  }

  & .wrap {
    margin-top: 17px;
  }
}
</style>
