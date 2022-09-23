<script lang="ts" setup>
import { Token, Address, Wei, WeiAsToken } from '@/core'
import { storeToRefs } from 'pinia'
import invariant from 'tiny-invariant'
import { KlayIconImportant } from '~klay-icons'
import BigNumber from 'bignumber.js'
import { Ref } from 'vue'
import { formatCurrency } from '@/utils/composable.currency-input'
import TokenSelect from './TokenSelect.vue'

const props = withDefaults(
  defineProps<{
    address?: Address
    selected?: Set<Address>
    modelValue?: WeiAsToken<BigNumber> | null
    valueDebounce?: number
    isLoading?: boolean
    setByBalance?: boolean
    // FIXME not by design
    estimated?: boolean
  }>(),
  {
    modelValue: null,
    isLoading: false,
    setByBalance: false,
    estimated: false,
    valueDebounce: 500,
  },
)

const emit = defineEmits(['update:modelValue', 'update:address'])

// #region  Model

const model = useVModel(props, 'modelValue', emit) as Ref<BigNumber | null>

const modelDebounced = shallowRef<BigNumber | null>(model.value)

watch(model, (value) => {
  if (!value || (modelDebounced.value && !value.eq(modelDebounced.value))) modelDebounced.value = value
})

watchDebounced(
  modelDebounced,
  (value) => {
    if (!value || (model.value && !value.eq(model.value))) model.value = value
  },
  { debounce: toRef(props, 'valueDebounce') },
)

// #endregion

// #region Stores

const dexStore = useDexStore()
const { isWalletConnected } = storeToRefs(dexStore)

const tokensStore = useTokensStore()
const { isBalancePending } = storeToRefs(tokensStore)

const tokenData = computed<null | Token>(() => (props.address && tokensStore.findTokenData(props.address)) ?? null)

const balance = computed<null | Wei>(() => (props.address && tokensStore.lookupUserBalance(props.address)) ?? null)

const balanceAsToken = computed(
  () => balance.value && tokenData.value && new BigNumber(balance.value.toToken(tokenData.value)),
)

const balanceFormatted = computed(() => balanceAsToken.value && formatCurrency({ amount: balanceAsToken.value }))

// #endregion

const showMaxButton = $computed(
  () => props.setByBalance && balance.value && model.value && !model.value.eq(balance.value.asBigNum),
)

const addressModel = useVModel(props, 'address', emit)

function setToMax() {
  invariant(balance)
  emit('update:modelValue', balanceAsToken)
}
</script>

<template>
  <InputCurrencyTemplate
    :class="{ 'pointer-events-none': isLoading }"
    :loading="isLoading"
    bottom
    size="lg"
    :max-button="showMaxButton"
    @click:max="setToMax()"
  >
    <template #input>
      <CurrencyInput
        v-if="tokenData && modelDebounced"
        v-model="modelDebounced"
        :decimals="tokenData.decimals"
        :disabled="isLoading"
      />
    </template>

    <template #top-right>
      <TokenSelect
        v-model:token="addressModel"
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
        :title="balanceFormatted ?? ''"
        class="balance flex items-center space-x-2"
      >
        <span class="truncate max-w-40">
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
  </InputCurrencyTemplate>
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
