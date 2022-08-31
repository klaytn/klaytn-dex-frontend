<script lang="ts" setup>
import { Token, Address, Wei, WeiAsToken } from '@/core'
import { storeToRefs } from 'pinia'
import invariant from 'tiny-invariant'
import { roundTo } from 'round-to'
import { KlayIconImportant } from '~klay-icons'

const props = withDefaults(
  defineProps<{
    address?: Address
    selected?: Set<Address>
    modelValue?: WeiAsToken
    valueDebounce?: number
    isLoading?: boolean
    isDisabled?: boolean
    setByBalance?: boolean
    // FIXME not by design
    estimated?: boolean
  }>(),
  {
    isLoading: false,
    isDisabled: false,
    setByBalance: false,
    estimated: false,
    valueDebounce: 500,
  },
)

const emit = defineEmits(['update:modelValue', 'update:address'])

const model = useVModel(props, 'modelValue', emit)

const modelDebounced = ref(model.value)
watch(model, (value) => {
  modelDebounced.value = value
})
watchDebounced(
  modelDebounced,
  (value) => {
    if (value !== model.value) {
      model.value = value
    }
  },
  { debounce: toRef(props, 'valueDebounce') },
)

// const addrFormatted = $computed(() => {
//   return props.token && formatAddress(props.token)
// })

const dexStore = useDexStore()
const { isWalletConnected } = storeToRefs(dexStore)

const tokensStore = useTokensStore()
const { isBalancePending } = storeToRefs(tokensStore)

const tokenData = $computed<null | Token>(() => (props.address && tokensStore.findTokenData(props.address)) ?? null)

const balance = $computed<null | Wei>(() => (props.address && tokensStore.lookupUserBalance(props.address)) ?? null)
const balanceRaw = $computed(() => {
  if (!balance || !tokenData) return null
  return balance.toToken(tokenData)
})
const balanceFormatted = $computed(() => {
  if (!balanceRaw) return null
  return roundTo(Number(balanceRaw), 5)
})

const showMaxButton = $computed(() => {
  return props.setByBalance && balance && props.modelValue !== balanceRaw
})

const tokenModel = useVModel(props, 'address', emit)

function setToMax() {
  invariant(balance)
  emit('update:modelValue', balanceRaw)
}
</script>

<template>
  <InputTokenTemplate
    v-model="modelDebounced"
    :class="{ 'pointer-events-none': isLoading }"
    :input-disabled="isDisabled"
    :input-loading="isLoading"
    bottom
    :max-button="showMaxButton"
    @click:max="setToMax()"
  >
    <template #top-right>
      <TokenSelect
        v-model:token="tokenModel"
        v-bind="{ selected }"
        data-testid="token-select"
      />
    </template>

    <template #bottom-left>
      <span
        v-if="estimated"
        class="estimated"
      > estimated * </span>
    </template>

    <template #bottom-right>
      <div
        :title="balance?.asStr"
        class="balance flex items-center space-x-2"
      >
        <span>
          <template v-if="isWalletConnected">
            Balance:
            <ValueOrDash :value="balanceFormatted" />
          </template>
          <template v-else> Balance: Connect Wallet </template>
        </span>
        <KlayLoader
          v-if="isBalancePending"
          color="gray"
          size="14"
        />
        <KlayIconImportant />
      </div>
    </template>
  </InputTokenTemplate>
</template>

<style scoped lang="scss">
@import '@/styles/vars';

.balance {
  max-width: 200px;
}

.balance,
.estimated {
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 15px;
  color: #778294;
}
</style>
