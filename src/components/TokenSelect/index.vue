<script lang="ts" setup>
import { Address } from '@/core/kaikas'
import IconCollapseArrow from '@/assets/icons/collapse-arrow.svg'

const props = withDefaults(
  defineProps<{
    token?: null | Address
  }>(),
  { token: null },
)

const emit = defineEmits(['update:token'])

const tokensStore = useTokensStore()
const tokenData = $computed(() => props.token && tokensStore.findTokenData(props.token))

let model = $(useVModel(props, 'token', emit))
let isModalOpen = $ref(false)

function onSelect(token: Address) {
  model = token
  isModalOpen = false
}
</script>

<template>
  <TokenSelectModal
    v-model:open="isModalOpen"
    @select="onSelect"
  />

  <KlayButton
    v-if="!token"
    type="primary"
    icon-position="right"
    @click="isModalOpen = true"
  >
    Select Token

    <template #icon>
      <IconCollapseArrow />
    </template>
  </KlayButton>

  <button
    v-else
    class="btn-filled"
  >
    <div
      class="btn-filled__content"
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
  </button>
</template>

<style scoped lang="scss">
@import '@/styles/vars';

.btn-empty {
  background: $blue;
  color: $white;
  border-radius: 8px;
  padding: 12px 12px;
  font-weight: 700;
  cursor: pointer;
}

.btn-filled {
  height: 40px;
  background: $white;
  border-radius: 8px;
  box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.07);

  &__content {
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
}
</style>
