<script lang="ts" setup>
import { Address } from '@/core'
import { KlayIconCollapseArrow } from '~klay-icons'
import TokenSelectModal from './TokenSelectModal.vue'

const props = withDefaults(
  defineProps<{
    token?: null | Address
    selected?: null | Set<Address>
  }>(),
  {
    token: null,
    selected: null,
  },
)

const emit = defineEmits(['update:token'])

const tokensStore = useTokensStore()

const tokenData = computed(() => props.token && tokensStore.findTokenData(props.token))

const model = useVModel(props, 'token', emit)
const isModalOpen = ref(false)

function onSelect(token: Address) {
  model.value = token
  isModalOpen.value = false
}
</script>

<template>
  <TokenSelectModal
    v-model:show="isModalOpen"
    :selected="selected"
    :tokens="tokensStore.importedAndWhitelistTokens"
    @select="onSelect"
    @import-token="tokensStore.importToken($event)"
  />

  <KlayButton
    v-if="!token"
    type="primary"
    icon-position="right"
    v-bind="$attrs"
    @click="isModalOpen = true"
  >
    Select Token

    <template #icon>
      <KlayIconCollapseArrow />
    </template>
  </KlayButton>

  <KlayButton
    v-else
    v-bind="$attrs"
    @click="isModalOpen = true"
  >
    <div
      v-if="tokenData"
      class="flex items-center space-x-2 text-black"
    >
      <KlayCharAvatar :symbol="tokenData.symbol" />
      <span>
        {{ tokenData.symbol }}
      </span>
    </div>
  </KlayButton>
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
