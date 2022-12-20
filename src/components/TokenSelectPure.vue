<script lang="ts" setup>
import { Address, Token } from '@/core'
import { useMinimalTokensApi } from '@/utils/minimal-tokens-api'
import { KlayIconCollapseArrow } from '~klay-icons'
import TokenSelectModal from './TokenSelectModal.vue'
import { P, match } from 'ts-pattern'

interface Props {
  token?: null | Address
  selected?: null | Set<Address>
  tokensImportedAddresses: Address[]
  tokensWhitelist: Token[]
  areImportedTokensPending?: boolean
}

interface Emits {
  (event: 'update:token', value: null | Address): void
  (event: 'import-token', token: Token): void
}

const props = withDefaults(defineProps<Props>(), {
  token: null,
  selected: null,
  areImportedTokensPending: false,
})

const emit = defineEmits<Emits>()

const { lookupToken } = useMinimalTokensApi()

const completeSelected = computed(() => {
  const set = new Set(props.selected)
  props.token && set.add(props.token)
  return set
})

const tokenData = computed(() => props.token && lookupToken(props.token))

const model = useVModel(props, 'token', emit)

const isModalOpen = ref(false)

function onSelect(token: Address) {
  model.value = token
  isModalOpen.value = false
}

const selectedTokenAsRegex = computed(() => model.value && new RegExp('^' + model.value + '$', 'i'))

const isImportedTokenSelected = computed<boolean>(() =>
  match(selectedTokenAsRegex.value)
    .with(P.not(null), (reg) => !!props.tokensImportedAddresses.find((x) => reg.test(x)))
    .otherwise(() => false),
)

const isUnknownTokenSelected = computed<boolean>(() =>
  match([selectedTokenAsRegex.value, isImportedTokenSelected.value] as const)
    .with([P.select(P.not(null)), false], (reg) => !props.tokensWhitelist.find((x) => reg.test(x.address)))
    .otherwise(() => false),
)

const isButtonLoading = logicAnd(isImportedTokenSelected, toRef(props, 'areImportedTokensPending'))
</script>

<template>
  <TokenSelectModal
    :show="isModalOpen"
    :selected="completeSelected"
    v-bind="{ tokensWhitelist, tokensImportedAddresses, areImportedTokensPending }"
    :unknown-selected-address="isUnknownTokenSelected ? model! : null"
    @select="onSelect"
    @import-token="emit('import-token', $event)"
    @close="isModalOpen = false"
    @drop-unknown-selection="model = null"
  />

  <KlayButton
    v-if="!token"
    type="primary"
    icon-position="right"
    v-bind="$attrs"
    data-testid="token-select"
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
    data-testid="token-select"
    :loading="isButtonLoading"
    class="min-w-24"
    @click="isModalOpen = true"
  >
    <div
      v-if="tokenData || isUnknownTokenSelected"
      class="flex items-center space-x-2 text-black"
    >
      <template v-if="tokenData">
        <KlayCharAvatar :symbol="tokenData.symbol" />
        <span>
          {{ tokenData.symbol }}
        </span>
      </template>
      <template v-else>
        <KlayCharAvatar symbol="?" />
        <span>Unknown</span>
      </template>
    </div>
  </KlayButton>
</template>

<style scoped lang="scss">
@use '@/styles/vars';

.btn-empty {
  background: vars.$blue;
  color: vars.$white;
  border-radius: 8px;
  padding: 12px 12px;
  font-weight: 700;
  cursor: pointer;
}

.btn-filled {
  height: 40px;
  background: vars.$white;
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
      color: vars.$dark2;
      margin-left: 8px;
    }
  }
}
</style>
