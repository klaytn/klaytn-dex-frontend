<script lang="ts" setup>
import { Address } from '@/core/kaikas'

const props = withDefaults(
  defineProps<{
    token?: null | Address
  }>(),
  { token: null },
)

const emit = defineEmits(['update:token'])

const tokensStore = useTokensStore()
const tokenData = $computed(() => props.token && tokensStore.tryFindToken(props.token))

let model = $(useVModel(props, 'token', emit))
let isModalOpen = $ref(false)

function onSelect(token: Address) {
  model = token
  isModalOpen = false
}
</script>

<template>
  <div class="select--wrap">
    <TokenSelectModal
      v-model:open="isModalOpen"
      @select="onSelect"
    />

    <button
      v-if="!token"
      class="select-btn"
      @click="isModalOpen = true"
    >
      <span>Select token</span>
      <KlayIcon name="collapse-arrow" />
    </button>

    <div
      v-else
      class="select"
    >
      <div
        class="select--head"
        @click="isModalOpen = true"
      >
        <template v-if="tokenData">
          <KlayIcon
            :char="tokenData.symbol[0]"
            name="empty-token"
          />
          <span>
            {{ tokenData.symbol }}
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/vars';

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
